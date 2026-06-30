import { prefersReducedMotion } from "../../experience/motion/prefersReducedMotion";

const MAX_FRAME_DT = 0.032;
const SETTLE_POSITION = 0.2;
const SETTLE_ANGLE = 0.15;
const SETTLE_VELOCITY = 0.08;

const POS_FORCE = 0.14;
const POS_DAMPING = 0.78;

const ANGLE_FORCE = 0.09;
const ANGLE_DAMPING = 0.82;
const VELOCITY_TO_ANGLE = 0.065;
const VELOCITY_DECAY = 0.86;
const MAX_TILT_DEG = 30;

function getTooltipLayer(host: HTMLElement): HTMLElement | null {
  return host.closest<HTMLElement>("[data-tooltip-layer]");
}

function setTooltipLayerActive(host: HTMLElement, active: boolean) {
  const layer = getTooltipLayer(host);
  if (!layer) return;

  if (active) layer.setAttribute("data-tooltip-layer-active", "");
  else layer.removeAttribute("data-tooltip-layer-active");
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

function clampFollowShift(raw: number, hostWidth: number) {
  const ratio = readToken("--tooltip-follow-clamp", 0.4);
  const max = hostWidth * (ratio > 0 ? ratio : 0.4);
  return clamp(raw, -max, max);
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

function bindTooltipHost(host: HTMLElement) {
  if (host.hasAttribute("data-tooltip-bound")) return;

  const tooltip = host.querySelector<HTMLElement>(".tooltip");
  if (!tooltip) return;

  host.setAttribute("data-tooltip-bound", "true");

  const reducedMotion = prefersReducedMotion();
  let isActive = false;
  let rafId = 0;
  let lastTimestamp = 0;

  let shiftCurrent = 0;
  let shiftTarget = 0;
  let shiftVelocity = 0;

  let angleCurrent = 0;
  let angleTarget = 0;
  let angleVelocity = 0;
  let mouseVelocityX = 0;

  let lastPointerX = 0;
  let lastPointerTime = 0;

  const applyMotion = () => {
    tooltip.style.setProperty("--tooltip-shift-x", `${shiftCurrent}px`);
    tooltip.style.setProperty("--tooltip-tilt", `${angleCurrent}deg`);
  };

  const isPhysicsSettled = () =>
    Math.abs(shiftTarget - shiftCurrent) <= SETTLE_POSITION &&
    Math.abs(shiftVelocity) <= SETTLE_VELOCITY &&
    Math.abs(angleTarget - angleCurrent) <= SETTLE_ANGLE &&
    Math.abs(angleVelocity) <= SETTLE_VELOCITY &&
    Math.abs(mouseVelocityX) <= SETTLE_VELOCITY;

  const tick = (timestamp: number) => {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min((timestamp - lastTimestamp) / 1000, MAX_FRAME_DT);
    lastTimestamp = timestamp;

    const maxTilt = readToken("--tooltip-tilt-max", MAX_TILT_DEG);
    const velocityToAngle = readToken("--tooltip-velocity-to-angle", VELOCITY_TO_ANGLE);
    const angleForce = readToken("--tooltip-balloon-force", ANGLE_FORCE);
    const angleDamping = readToken("--tooltip-balloon-damping", ANGLE_DAMPING);

    mouseVelocityX *= VELOCITY_DECAY ** (dt * 60);
    angleTarget = clamp(-mouseVelocityX * velocityToAngle, -maxTilt, maxTilt);

    const shiftStep = stepInertial(
      shiftCurrent,
      shiftVelocity,
      shiftTarget,
      POS_FORCE,
      POS_DAMPING,
      dt,
    );
    shiftCurrent = shiftStep.current;
    shiftVelocity = shiftStep.velocity;

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
      shiftCurrent = shiftTarget;
      shiftVelocity = 0;
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
    if (reducedMotion) return;
    if (!rafId) {
      lastTimestamp = 0;
      rafId = requestAnimationFrame(tick);
    }
  };

  const snapMotion = () => {
    shiftCurrent = shiftTarget;
    shiftVelocity = 0;
    angleCurrent = angleTarget;
    angleVelocity = 0;
    mouseVelocityX = 0;
    applyMotion();
  };

  const setTargetFromPointer = (clientX: number, timestamp: number) => {
    const rect = host.getBoundingClientRect();
    shiftTarget = clampFollowShift(clientX - rect.left - rect.width / 2, rect.width);

    if (lastPointerTime > 0) {
      const dt = (timestamp - lastPointerTime) / 1000;
      if (dt > 0 && dt < 0.2) {
        const instantVelocity = (clientX - lastPointerX) / dt;
        mouseVelocityX = mouseVelocityX * 0.35 + instantVelocity * 0.65;
      }
    }

    lastPointerX = clientX;
    lastPointerTime = timestamp;

    if (reducedMotion) {
      snapMotion();
      return;
    }

    startLoop();
  };

  const resetMotion = () => {
    shiftTarget = 0;
    angleTarget = 0;
    lastPointerTime = 0;
    if (reducedMotion) {
      snapMotion();
      return;
    }
    startLoop();
  };

  const hide = () => {
    isActive = false;
    host.removeAttribute("data-tooltip-visible");
    setTooltipLayerActive(host, false);
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      lastTimestamp = 0;
    }
    resetMotion();
  };

  const dismiss = () => {
    hide();
    host.setAttribute("data-tooltip-dismissed", "");
    if (host.contains(document.activeElement)) {
      (document.activeElement as HTMLElement).blur();
    }
  };

  const clearDismiss = () => {
    host.removeAttribute("data-tooltip-dismissed");
  };

  const canShow = () => !host.hasAttribute("data-tooltip-dismissed");

  host.addEventListener("mouseenter", (event) => {
    if (!canShow()) return;
    isActive = true;
    host.setAttribute("data-tooltip-visible", "");
    setTooltipLayerActive(host, true);
    lastPointerX = event.clientX;
    lastPointerTime = performance.now();
    setTargetFromPointer(event.clientX, lastPointerTime);
  });

  host.addEventListener("mousemove", (event) => {
    if (!isActive) return;
    setTargetFromPointer(event.clientX, performance.now());
  });

  host.addEventListener("mouseleave", () => {
    clearDismiss();
    hide();
  });

  host.addEventListener("mousedown", dismiss);
  host.addEventListener("click", dismiss);

  host.addEventListener("focusin", () => {
    if (!canShow()) return;
    isActive = true;
    host.setAttribute("data-tooltip-visible", "");
    setTooltipLayerActive(host, true);
    mouseVelocityX = 0;
    resetMotion();
  });

  host.addEventListener("focusout", (event) => {
    if (host.contains(event.relatedTarget as Node | null)) return;
    hide();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return;
    if (
      !host.hasAttribute("data-tooltip-visible") &&
      !host.contains(document.activeElement)
    ) {
      return;
    }
    dismiss();
  });
}

export function initDragTooltips(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-tooltip-host]").forEach(bindTooltipHost);
}
