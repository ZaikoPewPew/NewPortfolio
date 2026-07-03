import { isMobileViewport, prefersReducedMotion } from "../../experience/motion/prefersReducedMotion";
import { createWash, readWashTint, type WashController } from "../../experience/wash/wash.client";

const MAX_FRAME_DT = 0.032;
const SETTLE_POSITION = 0.35;
const SETTLE_ANGLE = 0.15;
const SETTLE_VELOCITY = 0.08;

const POS_FORCE = 0.14;
const POS_DAMPING = 0.78;

const ANGLE_FORCE = 0.09;
const ANGLE_DAMPING = 0.82;
const VELOCITY_TO_ANGLE = 0.065;
const VELOCITY_DECAY = 0.86;
const MAX_TILT_DEG = 12;

const POINTER_OFFSET_X = 24;
const POINTER_OFFSET_Y = 24;

type EmployerPortal = {
  root: HTMLElement;
  overlay: HTMLElement;
  block: HTMLElement;
  video: HTMLVideoElement | null;
  wash: WashController | null;
};

let sharedPortal: EmployerPortal | null = null;
let sharedFloat: HTMLElement | null = null;
let sharedPrefixFloat: HTMLElement | null = null;
const washByRoot = new WeakMap<HTMLElement, WashController>();

function destroyPortal(portal: EmployerPortal) {
  portal.wash?.destroy();
  washByRoot.delete(portal.root);
  portal.root.remove();
  portal.block.remove();
}

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

function isDesktopEmployer() {
  return !isMobileViewport();
}

function findPortalInDom(): EmployerPortal | null {
  document.querySelectorAll<HTMLElement>("[data-employer-overlay]").forEach((overlay) => {
    if (!overlay.closest("[data-employer-focus-root]")) overlay.remove();
  });
  const blocks = document.querySelectorAll<HTMLElement>("[data-currently-block]");
  blocks.forEach((block, index) => {
    if (index < blocks.length - 1) block.remove();
  });

  const roots = document.querySelectorAll<HTMLElement>("[data-employer-focus-root]");
  roots.forEach((root, index) => {
    if (index < roots.length - 1) {
      washByRoot.get(root)?.destroy();
      washByRoot.delete(root);
      root.remove();
    }
  });

  const root = document.querySelector<HTMLElement>("[data-employer-focus-root]");
  const block = document.querySelector<HTMLElement>("[data-currently-block]");
  if (!root || !block) {
    root?.remove();
    block?.remove();
    return null;
  }

  const overlay = root.querySelector<HTMLElement>("[data-employer-overlay]");
  if (!overlay) {
    destroyPortal({ root, overlay: root, block, video: null, wash: null });
    return null;
  }

  let wash = washByRoot.get(root) ?? null;
  const canvas = overlay.querySelector<HTMLCanvasElement>("[data-wash-canvas]");
  if (!wash && canvas && !prefersReducedMotion()) {
    wash = createWash(canvas);
    washByRoot.set(root, wash);
  }

  return {
    root,
    overlay,
    block,
    video: block.querySelector<HTMLVideoElement>(".currently-block__video"),
    wash,
  };
}

function createPortal(videoSrc?: string): EmployerPortal {
  const root = document.createElement("div");
  root.className = "employer-focus-root";
  root.setAttribute("data-employer-focus-root", "");
  root.setAttribute("aria-hidden", "true");

  const overlay = document.createElement("div");
  overlay.className = "employer-name__overlay";
  overlay.setAttribute("data-employer-overlay", "");
  overlay.setAttribute("aria-hidden", "true");

  const backdrop = document.createElement("div");
  backdrop.className = "employer-name__backdrop";
  backdrop.setAttribute("aria-hidden", "true");

  const washCanvas = document.createElement("canvas");
  washCanvas.className = "wash__canvas";
  washCanvas.setAttribute("data-wash-canvas", "");
  washCanvas.setAttribute("aria-hidden", "true");

  overlay.append(washCanvas);
  root.append(backdrop, overlay);

  const block = document.createElement("div");
  block.className = "currently-block";
  block.setAttribute("data-currently-block", "");
  block.setAttribute("aria-hidden", "true");

  const frame = document.createElement("div");
  frame.className = "currently-block__frame";

  const media = document.createElement("div");
  media.className = "currently-block__media";

  let video: HTMLVideoElement | null = null;
  if (videoSrc) {
    video = document.createElement("video");
    video.className = "currently-block__video";
    video.src = videoSrc;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("muted", "");
    video.setAttribute("aria-hidden", "true");
    media.append(video);
  }

  frame.append(media);
  block.append(frame);
  root.append(backdrop, overlay);
  document.body.append(root, block);

  let wash: WashController | null = null;
  if (!prefersReducedMotion()) {
    wash = createWash(washCanvas);
    washByRoot.set(root, wash);
  }

  return { root, overlay, block, video, wash };
}

function getSharedPortal(videoSrc?: string): EmployerPortal {
  if (sharedPortal && document.body.contains(sharedPortal.root)) {
    return sharedPortal;
  }
  sharedPortal = findPortalInDom() ?? createPortal(videoSrc);
  return sharedPortal;
}

/**
 * Floating label — прямой потомок body.
 *
 * position: sticky у header всегда создаёт stacking context (браузерная спека),
 * поэтому z-index внутри header не может превысить его уровень.
 * Float рендерится вне header, в stacking context body → z-index: 250.
 * Prefix float — тот же слой, чтобы «currently at» не уходил под wash.
 * Currently-block — отдельный слой body → z-index: 255, выше float.
 */
function getSharedFloat(): HTMLElement {
  if (sharedFloat && document.body.contains(sharedFloat)) return sharedFloat;

  const existing = document.querySelector<HTMLElement>("[data-employer-float]");
  if (existing) {
    sharedFloat = existing;
    return existing;
  }

  const el = document.createElement("span");
  el.className = "employer-name__label-float";
  el.setAttribute("data-employer-float", "");
  el.setAttribute("aria-hidden", "true");
  document.body.append(el);
  sharedFloat = el;
  return el;
}

function getSharedPrefixFloat(): HTMLElement {
  if (sharedPrefixFloat && document.body.contains(sharedPrefixFloat)) return sharedPrefixFloat;

  const existing = document.querySelector<HTMLElement>("[data-employer-prefix-float]");
  if (existing) {
    sharedPrefixFloat = existing;
    return existing;
  }

  const el = document.createElement("span");
  el.className = "employer-prefix__float";
  el.setAttribute("data-employer-prefix-float", "");
  el.setAttribute("aria-hidden", "true");
  document.body.append(el);
  sharedPrefixFloat = el;
  return el;
}

function syncFloatElement(floatEl: HTMLElement, source: HTMLElement) {
  const rect = source.getBoundingClientRect();
  const s = window.getComputedStyle(source);
  const dpr = window.devicePixelRatio || 1;
  const snap = (v: number) => Math.round(v * dpr) / dpr;
  floatEl.style.top = `${snap(rect.top)}px`;
  floatEl.style.left = `${snap(rect.left)}px`;
  floatEl.style.fontFamily = s.fontFamily;
  floatEl.style.fontSize = s.fontSize;
  floatEl.style.fontWeight = s.fontWeight;
  floatEl.style.fontStyle = s.fontStyle;
  floatEl.style.lineHeight = `${rect.height}px`;
  floatEl.style.letterSpacing = s.letterSpacing;
  floatEl.style.color = s.color;
  floatEl.textContent = source.textContent;
}

function bindEmployerHost(host: HTMLElement) {
  if (host.hasAttribute("data-employer-bound")) return;

  const label = host.querySelector<HTMLElement>(".employer-name__label");
  if (!label) return;

  const prefix = host.parentElement?.querySelector<HTMLElement>("[data-employer-prefix]") ?? null;
  const { block, video, wash } = getSharedPortal(host.dataset.employerVideo);
  const floatEl = getSharedFloat();
  const prefixFloatEl = prefix ? getSharedPrefixFloat() : null;
  const washTintId = host.dataset.washTint ?? "employer";
  host.setAttribute("data-employer-bound", "true");

  const reducedMotion = prefersReducedMotion();
  const disabled = () => reducedMotion || !isDesktopEmployer();

  let isActive = false;
  let rafId = 0;
  let lastTimestamp = 0;

  let posX = 0;
  let posY = 0;
  let targetX = 0;
  let targetY = 0;
  let velocityX = 0;
  let velocityY = 0;

  let angleCurrent = 0;
  let angleTarget = 0;
  let angleVelocity = 0;
  let mouseVelocityX = 0;

  let lastPointerX = 0;
  let lastPointerTime = 0;

  const syncFloat = () => {
    syncFloatElement(floatEl, label);
    if (prefix && prefixFloatEl) syncFloatElement(prefixFloatEl, prefix);
  };

  const showFloat = () => {
    syncFloat();
    label.style.visibility = "hidden";
    floatEl.style.visibility = "visible";
    if (prefix && prefixFloatEl) {
      prefix.style.visibility = "hidden";
      prefixFloatEl.style.visibility = "visible";
    }
  };

  const hideFloat = () => {
    floatEl.style.visibility = "hidden";
    label.style.visibility = "";
    if (prefix && prefixFloatEl) {
      prefixFloatEl.style.visibility = "hidden";
      prefix.style.visibility = "";
    }
  };

  const onScrollWhileActive = () => {
    if (!isActive) return;
    syncFloat();
  };

  const applyMotion = () => {
    block.style.setProperty("--currently-block-x", `${posX}px`);
    block.style.setProperty("--currently-block-y", `${posY}px`);
    block.style.setProperty("--currently-block-tilt", `${angleCurrent}deg`);
  };

  const isPhysicsSettled = () =>
    Math.abs(targetX - posX) <= SETTLE_POSITION &&
    Math.abs(targetY - posY) <= SETTLE_POSITION &&
    Math.abs(velocityX) <= SETTLE_VELOCITY &&
    Math.abs(velocityY) <= SETTLE_VELOCITY &&
    Math.abs(angleTarget - angleCurrent) <= SETTLE_ANGLE &&
    Math.abs(angleVelocity) <= SETTLE_VELOCITY &&
    Math.abs(mouseVelocityX) <= SETTLE_VELOCITY;

  const tick = (timestamp: number) => {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min((timestamp - lastTimestamp) / 1000, MAX_FRAME_DT);
    lastTimestamp = timestamp;

    const maxTilt = readToken("--employer-tilt-max", MAX_TILT_DEG);
    const velocityToAngle = readToken("--employer-velocity-to-angle", VELOCITY_TO_ANGLE);
    const angleForce = readToken("--employer-balloon-force", ANGLE_FORCE);
    const angleDamping = readToken("--employer-balloon-damping", ANGLE_DAMPING);
    const posForce = readToken("--employer-follow-force", POS_FORCE);
    const posDamping = readToken("--employer-follow-damping", POS_DAMPING);

    mouseVelocityX *= VELOCITY_DECAY ** (dt * 60);
    angleTarget = clamp(-mouseVelocityX * velocityToAngle, -maxTilt, maxTilt);

    const xStep = stepInertial(posX, velocityX, targetX, posForce, posDamping, dt);
    posX = xStep.current;
    velocityX = xStep.velocity;

    const yStep = stepInertial(posY, velocityY, targetY, posForce, posDamping, dt);
    posY = yStep.current;
    velocityY = yStep.velocity;

    const angleStep = stepInertial(
      angleCurrent,
      angleVelocity,
      angleTarget,
      angleForce,
      angleDamping,
      dt,
    );
    angleCurrent = angleStep.current;
    angleVelocity = angleStep.velocity;

    applyMotion();

    if (!isActive && isPhysicsSettled()) {
      posX = targetX;
      posY = targetY;
      velocityX = 0;
      velocityY = 0;
      angleCurrent = angleTarget;
      angleVelocity = 0;
      mouseVelocityX = 0;
      applyMotion();
      rafId = 0;
      lastTimestamp = 0;
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  const startLoop = () => {
    if (disabled()) return;
    if (!rafId) {
      lastTimestamp = 0;
      rafId = requestAnimationFrame(tick);
    }
  };

  const snapMotion = () => {
    posX = targetX;
    posY = targetY;
    velocityX = 0;
    velocityY = 0;
    angleCurrent = angleTarget;
    angleVelocity = 0;
    mouseVelocityX = 0;
    applyMotion();
  };

  const setTargetFromPointer = (clientX: number, clientY: number, timestamp: number) => {
    targetX = clientX + POINTER_OFFSET_X;
    targetY = clientY + POINTER_OFFSET_Y;

    if (lastPointerTime > 0) {
      const dt = (timestamp - lastPointerTime) / 1000;
      if (dt > 0 && dt < 0.2) {
        const instantVelocity = (clientX - lastPointerX) / dt;
        mouseVelocityX = mouseVelocityX * 0.35 + instantVelocity * 0.65;
      }
    }

    lastPointerX = clientX;
    lastPointerTime = timestamp;

    if (disabled()) {
      snapMotion();
      return;
    }

    startLoop();
  };

  const resetMotion = () => {
    angleTarget = 0;
    lastPointerTime = 0;
    if (disabled()) {
      snapMotion();
      return;
    }
    startLoop();
  };

  const activate = (clientX: number, clientY: number) => {
    if (disabled()) return;
    if (isActive) {
      setTargetFromPointer(clientX, clientY, performance.now());
      return;
    }
    isActive = true;
    host.setAttribute("data-employer-active", "");
    wash?.setTintId(washTintId);
    showFloat();
    document.documentElement.classList.add("is-employer-active");
    window.addEventListener("scroll", onScrollWhileActive, { passive: true });
    lastPointerX = clientX;
    lastPointerTime = performance.now();
    setTargetFromPointer(clientX, clientY, lastPointerTime);
    video?.play().catch(() => {});
  };

  const deactivate = () => {
    if (!isActive) return;
    isActive = false;
    host.removeAttribute("data-employer-active");
    document.documentElement.classList.remove("is-employer-active");
    window.removeEventListener("scroll", onScrollWhileActive);
    hideFloat();
    video?.pause();
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      lastTimestamp = 0;
    }
    resetMotion();
  };

  host.addEventListener("mouseenter", (event) => {
    activate(event.clientX, event.clientY);
  });

  host.addEventListener("mousemove", (event) => {
    if (!isActive) return;
    setTargetFromPointer(event.clientX, event.clientY, performance.now());
  });

  host.addEventListener("mouseleave", () => {
    deactivate();
  });

  host.addEventListener("focusin", () => {
    if (disabled() || isActive) return;
    const rect = label.getBoundingClientRect();
    activate(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  host.addEventListener("focusout", (event) => {
    if (host.contains(event.relatedTarget as Node | null)) return;
    deactivate();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden" || !isActive) return;
    deactivate();
  });
}

export function initEmployerName(root: ParentNode = document) {
  findPortalInDom();
  root.querySelectorAll<HTMLElement>("[data-employer-name-host]").forEach(bindEmployerHost);
}

export function resetEmployerName() {
  document.documentElement.classList.remove("is-employer-active");
  document.querySelectorAll<HTMLElement>("[data-employer-name-host]").forEach((host) => {
    host.removeAttribute("data-employer-active");
    const lbl = host.querySelector<HTMLElement>(".employer-name__label");
    if (lbl) lbl.style.visibility = "";
    const prefix = host.parentElement?.querySelector<HTMLElement>("[data-employer-prefix]");
    if (prefix) prefix.style.visibility = "";
  });
  if (sharedFloat) sharedFloat.style.visibility = "hidden";
  if (sharedPrefixFloat) sharedPrefixFloat.style.visibility = "hidden";
  sharedPortal?.video?.pause();
}
