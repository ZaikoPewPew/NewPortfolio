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
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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

export function syncPageEnterOnLoad() {
  if (document.body.dataset.page !== "home") return;

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

  const totalMs = readMotionMs("--motion-page-enter-total", 2800);

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
