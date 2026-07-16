import { prefersReducedMotion } from "../motion/prefersReducedMotion";
import { getNextTheme, userPreferences, type ThemeMode } from "./UserPreferences";

export interface ThemeTransitionOrigin {
  x: number;
  y: number;
}

/**
 * Baseline (pre-smooth pass) — restore if needed:
 * - MOTION_MS = 500
 * - easeOutExpo: t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
 * - hard mask edge: transparent ${r}px, #000 ${r}px (no feather)
 * - rAF loop writing maskImage / webkitMaskImage each frame
 */
const MOTION_MS = 480;
/** Soft band hides per-frame radius jumps on a hard mask edge. */
const MASK_FEATHER_PX = 36;

function maxRevealRadius(x: number, y: number): number {
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
}

/** Gentler than expo: expansion stays readable frame-to-frame, less “slideshow”. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Hole grows: transparent center reveals the already-switched page. */
function maskGradient(x: number, y: number, radius: number): string {
  const inner = Math.max(0, radius);
  const outer = inner + MASK_FEATHER_PX;
  return `radial-gradient(circle at ${x}px ${y}px, transparent ${inner}px, #000 ${outer}px)`;
}

function runCircleReveal(
  x: number,
  y: number,
  oldTheme: ThemeMode,
  nextTheme: ThemeMode
): ThemeMode {
  userPreferences.set({ theme: nextTheme });

  const radius = maxRevealRadius(x, y);
  const veil = document.createElement("div");
  veil.className = "theme-switch-veil";
  veil.setAttribute("data-theme", oldTheme);
  const startMask = maskGradient(x, y, 0);
  veil.style.maskImage = startMask;
  veil.style.webkitMaskImage = startMask;
  document.body.appendChild(veil);

  const start = performance.now();

  function frame(now: number) {
    const progress = Math.min((now - start) / MOTION_MS, 1);
    const eased = easeOutCubic(progress);
    const currentRadius = radius * eased;
    const mask = maskGradient(x, y, currentRadius);

    veil.style.maskImage = mask;
    veil.style.webkitMaskImage = mask;

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      veil.remove();
    }
  }

  requestAnimationFrame(frame);
  return nextTheme;
}

export function toggleThemeWithTransition(origin?: ThemeTransitionOrigin): ThemeMode {
  const oldTheme = userPreferences.get().theme;
  const nextTheme = getNextTheme(oldTheme);

  if (prefersReducedMotion()) {
    userPreferences.set({ theme: nextTheme });
    return nextTheme;
  }

  if (!origin) {
    userPreferences.set({ theme: nextTheme });
    return nextTheme;
  }

  return runCircleReveal(origin.x, origin.y, oldTheme, nextTheme);
}
