import { prefersReducedMotion } from "../../../experience/motion/prefersReducedMotion";

declare global {
  interface Window {
    __pageEnterSkip?: boolean;
  }
}

let enterBound = false;
let enterTimer: number | undefined;

function shouldAnimatePageEnter(): boolean {
  if (prefersReducedMotion()) return false;
  if (document.documentElement.classList.contains("is-case-returning")) return false;
  return true;
}

function readMotionMs(token: string, fallback: number): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;transition-duration:var(" +
    token +
    ")";
  document.documentElement.appendChild(probe);
  const seconds = parseFloat(getComputedStyle(probe).transitionDuration);
  probe.remove();
  const ms = seconds * 1000;
  return Number.isFinite(ms) && ms > 0 ? ms : fallback;
}

function clearEnterTimer() {
  if (enterTimer !== undefined) {
    window.clearTimeout(enterTimer);
    enterTimer = undefined;
  }
}

export function finishPageEnter() {
  clearEnterTimer();
  delete document.documentElement.dataset.homeEnter;
  delete document.documentElement.dataset.homeEntering;
}

function hasPageEnter(): boolean {
  const page = document.body.dataset.page;
  return page === "home" || page === "case";
}

export function syncPageEnterOnLoad() {
  if (!hasPageEnter()) return;

  clearEnterTimer();

  if (window.__pageEnterSkip) {
    finishPageEnter();
    return;
  }

  if (!shouldAnimatePageEnter()) {
    finishPageEnter();
    return;
  }

  if (!document.documentElement.dataset.homeEnter) {
    document.documentElement.dataset.homeEnter = "true";
  }

  document.documentElement.dataset.homeEntering = "true";

  const totalMs = readMotionMs("--motion-page-enter-total", 4100);

  enterTimer = window.setTimeout(() => {
    finishPageEnter();
    enterTimer = undefined;
  }, totalMs);
}

export function bindPageEnter() {
  if (enterBound) return;
  enterBound = true;

  document.addEventListener("astro:before-preparation", () => {
    window.__pageEnterSkip = true;
    finishPageEnter();
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    finishPageEnter();
  });
}
