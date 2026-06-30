import { prefersReducedMotion } from "../../experience/motion/prefersReducedMotion";

const FOLLOW_STRENGTH = 0.16;
const SETTLE_THRESHOLD = 0.25;

function getTooltipLayer(host: HTMLElement): HTMLElement | null {
  return host.closest<HTMLElement>("[data-tooltip-layer]");
}

function setTooltipLayerActive(host: HTMLElement, active: boolean) {
  const layer = getTooltipLayer(host);
  if (!layer) return;

  if (active) layer.setAttribute("data-tooltip-layer-active", "");
  else layer.removeAttribute("data-tooltip-layer-active");
}

function bindTooltipHost(host: HTMLElement) {
  if (host.hasAttribute("data-tooltip-bound")) return;

  const tooltip = host.querySelector<HTMLElement>(".tooltip");
  if (!tooltip) return;

  host.setAttribute("data-tooltip-bound", "true");

  const reducedMotion = prefersReducedMotion();
  let currentX = 0;
  let targetX = 0;
  let rafId = 0;
  let isHovering = false;

  const applyShift = () => {
    tooltip.style.setProperty("--tooltip-shift-x", `${currentX}px`);
  };

  const tick = () => {
    currentX += (targetX - currentX) * FOLLOW_STRENGTH;

    if (Math.abs(targetX - currentX) <= SETTLE_THRESHOLD) {
      currentX = targetX;
      applyShift();
      rafId = 0;
      return;
    }

    applyShift();
    rafId = requestAnimationFrame(tick);
  };

  const scheduleTick = () => {
    if (reducedMotion) {
      currentX = targetX;
      applyShift();
      return;
    }

    if (!rafId) rafId = requestAnimationFrame(tick);
  };

  const setTargetFromPointer = (clientX: number) => {
    const rect = host.getBoundingClientRect();
    targetX = clientX - rect.left - rect.width / 2;
    scheduleTick();
  };

  const resetPosition = () => {
    targetX = 0;
    if (reducedMotion) {
      currentX = 0;
      applyShift();
      return;
    }
    scheduleTick();
  };

  host.addEventListener("mouseenter", (event) => {
    isHovering = true;
    host.setAttribute("data-tooltip-visible", "");
    setTooltipLayerActive(host, true);
    setTargetFromPointer(event.clientX);
  });

  host.addEventListener("mousemove", (event) => {
    if (!isHovering) return;
    setTargetFromPointer(event.clientX);
  });

  host.addEventListener("mouseleave", () => {
    isHovering = false;
    host.removeAttribute("data-tooltip-visible");
    setTooltipLayerActive(host, false);
    resetPosition();
  });

  host.addEventListener("focusin", () => {
    host.setAttribute("data-tooltip-visible", "");
    setTooltipLayerActive(host, true);
    resetPosition();
  });

  host.addEventListener("focusout", (event) => {
    if (host.contains(event.relatedTarget as Node | null)) return;
    host.removeAttribute("data-tooltip-visible");
    setTooltipLayerActive(host, false);
    resetPosition();
  });
}

export function initDragTooltips(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-tooltip-host]").forEach(bindTooltipHost);
}
