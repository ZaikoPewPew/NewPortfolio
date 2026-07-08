import { isMobileViewport, prefersReducedMotion } from "../../experience/motion/prefersReducedMotion";
import { feedback } from "../../experience/feedback/FeedbackBus";
import type { SoundId } from "../../experience/feedback/sounds.config";

const MAX_FRAME_DT = 0.032;
const SETTLE_POSITION = 0.35;
const SETTLE_ANGLE = 0.15;
const SETTLE_VELOCITY = 0.08;

const DEFAULT_OFFSET_X = 24;
const DEFAULT_OFFSET_Y = 24;

const POS_FORCE = 0.14;
const POS_DAMPING = 0.78;
const ANGLE_FORCE = 0.09;
const ANGLE_DAMPING = 0.82;
const VELOCITY_TO_ANGLE = 0.065;
const VELOCITY_DECAY = 0.86;
const MAX_TILT_DEG = 12;

export type CurrentlyBlockActivateOptions = {
  videoSrc?: string;
  offsetX?: number;
  offsetY?: number;
  /** Start playback from the beginning on each activate. */
  restart?: boolean;
};

function readToken(name: string, fallback: number) {
  const raw = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(name),
  );
  return Number.isFinite(raw) ? raw : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function stepInertial(
  current: number,
  velocity: number,
  target: number,
  force: number,
  damping: number,
  dt: number,
) {
  const frames = dt * 60;
  const nextVelocity = (velocity + (target - current) * force * frames) * damping ** frames;
  return {
    current: current + nextVelocity * frames,
    velocity: nextVelocity,
  };
}

function resolveVideoUrl(src: string) {
  return new URL(src, window.location.origin).href;
}

function isDisabled() {
  return prefersReducedMotion() || isMobileViewport();
}

function createBlockElement(): { block: HTMLElement; video: HTMLVideoElement | null } {
  const block = document.createElement("div");
  block.className = "currently-block";
  block.setAttribute("data-currently-block", "");
  block.setAttribute("aria-hidden", "true");

  const frame = document.createElement("div");
  frame.className = "currently-block__frame";

  const media = document.createElement("div");
  media.className = "currently-block__media";

  const video = document.createElement("video");
  video.className = "currently-block__video";
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.setAttribute("muted", "");
  video.setAttribute("aria-hidden", "true");
  media.append(video);

  frame.append(media);
  block.append(frame);
  document.body.append(block);

  return { block, video };
}

function findBlockInDom(): { block: HTMLElement; video: HTMLVideoElement | null } | null {
  const blocks = document.querySelectorAll<HTMLElement>("[data-currently-block]");
  blocks.forEach((node, index) => {
    if (index < blocks.length - 1) node.remove();
  });

  const block = document.querySelector<HTMLElement>("[data-currently-block]");
  if (!block) return null;

  return {
    block,
    video: block.querySelector<HTMLVideoElement>(".currently-block__video"),
  };
}

export class CurrentlyBlockController {
  readonly element: HTMLElement;
  readonly video: HTMLVideoElement | null;

  private active = false;
  private rafId = 0;
  private lastTimestamp = 0;

  private offsetX = DEFAULT_OFFSET_X;
  private offsetY = DEFAULT_OFFSET_Y;

  private posX = 0;
  private posY = 0;
  private targetX = 0;
  private targetY = 0;
  private velocityX = 0;
  private velocityY = 0;

  private angleCurrent = 0;
  private angleTarget = 0;
  private angleVelocity = 0;
  private mouseVelocityX = 0;

  private lastPointerX = 0;
  private lastPointerTime = 0;

  constructor(existing?: { block: HTMLElement; video: HTMLVideoElement | null }) {
    const created = existing ?? createBlockElement();
    this.element = created.block;
    this.video = created.video;
  }

  isActive() {
    return this.active;
  }

  setVideoSrc(src?: string) {
    if (!this.video || !src) return;
    const next = resolveVideoUrl(src);
    if (this.video.src === next) return;
    this.video.src = src;
    this.video.load();
  }

  activate(clientX: number, clientY: number, options: CurrentlyBlockActivateOptions = {}) {
    if (isDisabled()) return;

    this.offsetX = options.offsetX ?? DEFAULT_OFFSET_X;
    this.offsetY = options.offsetY ?? DEFAULT_OFFSET_Y;
    this.setVideoSrc(options.videoSrc);

    if (this.active) {
      this.setTargetFromPointer(clientX, clientY, performance.now());
      if (options.restart) this.restartVideo();
      return;
    }

    this.active = true;
    this.element.classList.add("is-active");
    this.lastPointerX = clientX;
    this.lastPointerTime = performance.now();
    this.setTargetFromPointer(clientX, clientY, this.lastPointerTime);
    if (options.restart) this.restartVideo();
    else this.video?.play().catch(() => {});
  }

  private restartVideo() {
    if (!this.video) return;
    try {
      this.video.currentTime = 0;
    } catch {
      // Ignore seek errors before metadata is ready.
    }
    this.video.play().catch(() => {});
  }

  deactivate() {
    if (!this.active) return;
    this.active = false;
    this.element.classList.remove("is-active");
    this.video?.pause();

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
      this.lastTimestamp = 0;
    }

    this.angleTarget = 0;
    this.lastPointerTime = 0;
    if (isDisabled()) {
      this.snapMotion();
      return;
    }
    this.startLoop();
  }

  movePointer(clientX: number, clientY: number) {
    if (!this.active) return;
    this.setTargetFromPointer(clientX, clientY, performance.now());
  }

  activateFromElement(target: HTMLElement, options: CurrentlyBlockActivateOptions = {}) {
    const rect = target.getBoundingClientRect();
    this.activate(rect.left + rect.width / 2, rect.top + rect.height / 2, options);
  }

  private applyMotion() {
    this.element.style.setProperty("--currently-block-x", `${this.posX}px`);
    this.element.style.setProperty("--currently-block-y", `${this.posY}px`);
    this.element.style.setProperty("--currently-block-tilt", `${this.angleCurrent}deg`);
  }

  private isPhysicsSettled() {
    return (
      Math.abs(this.targetX - this.posX) <= SETTLE_POSITION &&
      Math.abs(this.targetY - this.posY) <= SETTLE_POSITION &&
      Math.abs(this.velocityX) <= SETTLE_VELOCITY &&
      Math.abs(this.velocityY) <= SETTLE_VELOCITY &&
      Math.abs(this.angleTarget - this.angleCurrent) <= SETTLE_ANGLE &&
      Math.abs(this.angleVelocity) <= SETTLE_VELOCITY &&
      Math.abs(this.mouseVelocityX) <= SETTLE_VELOCITY
    );
  }

  private tick = (timestamp: number) => {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, MAX_FRAME_DT);
    this.lastTimestamp = timestamp;

    const maxTilt = readToken("--employer-tilt-max", MAX_TILT_DEG);
    const velocityToAngle = readToken("--employer-velocity-to-angle", VELOCITY_TO_ANGLE);
    const angleForce = readToken("--employer-balloon-force", ANGLE_FORCE);
    const angleDamping = readToken("--employer-balloon-damping", ANGLE_DAMPING);
    const posForce = readToken("--employer-follow-force", POS_FORCE);
    const posDamping = readToken("--employer-follow-damping", POS_DAMPING);

    this.mouseVelocityX *= VELOCITY_DECAY ** (dt * 60);
    this.angleTarget = clamp(-this.mouseVelocityX * velocityToAngle, -maxTilt, maxTilt);

    const xStep = stepInertial(
      this.posX,
      this.velocityX,
      this.targetX,
      posForce,
      posDamping,
      dt,
    );
    this.posX = xStep.current;
    this.velocityX = xStep.velocity;

    const yStep = stepInertial(
      this.posY,
      this.velocityY,
      this.targetY,
      posForce,
      posDamping,
      dt,
    );
    this.posY = yStep.current;
    this.velocityY = yStep.velocity;

    const angleStep = stepInertial(
      this.angleCurrent,
      this.angleVelocity,
      this.angleTarget,
      angleForce,
      angleDamping,
      dt,
    );
    this.angleCurrent = angleStep.current;
    this.angleVelocity = angleStep.velocity;

    this.applyMotion();

    if (!this.active && this.isPhysicsSettled()) {
      this.posX = this.targetX;
      this.posY = this.targetY;
      this.velocityX = 0;
      this.velocityY = 0;
      this.angleCurrent = this.angleTarget;
      this.angleVelocity = 0;
      this.mouseVelocityX = 0;
      this.applyMotion();
      this.rafId = 0;
      this.lastTimestamp = 0;
      return;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  private startLoop() {
    if (isDisabled()) return;
    if (!this.rafId) {
      this.lastTimestamp = 0;
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  private snapMotion() {
    this.posX = this.targetX;
    this.posY = this.targetY;
    this.velocityX = 0;
    this.velocityY = 0;
    this.angleCurrent = this.angleTarget;
    this.angleVelocity = 0;
    this.mouseVelocityX = 0;
    this.applyMotion();
  }

  private setTargetFromPointer(clientX: number, clientY: number, timestamp: number) {
    this.targetX = clientX + this.offsetX;
    this.targetY = clientY + this.offsetY;

    if (this.lastPointerTime > 0) {
      const dt = (timestamp - this.lastPointerTime) / 1000;
      if (dt > 0 && dt < 0.2) {
        const instantVelocity = (clientX - this.lastPointerX) / dt;
        this.mouseVelocityX = this.mouseVelocityX * 0.35 + instantVelocity * 0.65;
      }
    }

    this.lastPointerX = clientX;
    this.lastPointerTime = timestamp;

    if (isDisabled()) {
      this.snapMotion();
      return;
    }

    this.startLoop();
  }
}

let sharedBlock: CurrentlyBlockController | null = null;

export function getCurrentlyBlock(): CurrentlyBlockController {
  if (sharedBlock && document.body.contains(sharedBlock.element)) {
    return sharedBlock;
  }
  sharedBlock = new CurrentlyBlockController(findBlockInDom() ?? undefined);
  return sharedBlock;
}

function readOffset(raw: string | undefined, fallback: number) {
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseSound(raw: string | undefined): SoundId | null {
  if (raw === "hoverEmployer") return "hoverEmployer";
  if (raw === "hover") return "hover";
  return null;
}

export function bindCurrentlyBlockHost(host: HTMLElement) {
  if (host.hasAttribute("data-currently-block-bound")) return;

  const videoSrc = host.dataset.currentlyBlockVideo;
  if (!videoSrc) return;

  host.setAttribute("data-currently-block-bound", "true");

  const block = getCurrentlyBlock();
  const focusTarget =
    host.querySelector<HTMLElement>("[data-currently-block-focus]") ?? host;
  const sound = parseSound(host.dataset.currentlyBlockSound);
  const soundSource = host.dataset.currentlyBlockSoundSource ?? "currently-block";

  const activateOptions = (): CurrentlyBlockActivateOptions => ({
    videoSrc,
    offsetX: readOffset(host.dataset.currentlyBlockOffsetX, DEFAULT_OFFSET_X),
    offsetY: readOffset(host.dataset.currentlyBlockOffsetY, DEFAULT_OFFSET_Y),
  });

  host.addEventListener("mouseenter", (event) => {
    if (isDisabled()) return;
    block.activate(event.clientX, event.clientY, activateOptions());
    if (sound) feedback.emit({ sound, source: soundSource });
  });

  host.addEventListener("mousemove", (event) => {
    if (!block.isActive()) return;
    block.movePointer(event.clientX, event.clientY);
  });

  host.addEventListener("mouseleave", () => {
    block.deactivate();
  });

  host.addEventListener("focusin", () => {
    if (isDisabled() || block.isActive()) return;
    block.activateFromElement(focusTarget, activateOptions());
    if (sound) feedback.emit({ sound, source: soundSource });
  });

  host.addEventListener("focusout", (event) => {
    if (host.contains(event.relatedTarget as Node | null)) return;
    block.deactivate();
  });
}

export function initCurrentlyBlock(root: ParentNode = document) {
  getCurrentlyBlock();
  root.querySelectorAll<HTMLElement>("[data-currently-block-host]").forEach(bindCurrentlyBlockHost);
}

export function resetCurrentlyBlock() {
  sharedBlock?.deactivate();
  sharedBlock?.video?.pause();
}
