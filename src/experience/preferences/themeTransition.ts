import { prefersReducedMotion } from "../motion/prefersReducedMotion";
import { getNextTheme, userPreferences, type ThemeMode } from "./UserPreferences";

export interface ThemeTransitionOrigin {
  x: number;
  y: number;
}

const MOTION_MS = 500;

function maxRevealRadius(x: number, y: number): number {
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
}

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function maskGradient(x: number, y: number, radius: number): string {
  return `radial-gradient(circle at ${x}px ${y}px, transparent ${radius}px, #000 ${radius}px)`;
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
  veil.style.maskImage = maskGradient(x, y, 0);
  veil.style.webkitMaskImage = maskGradient(x, y, 0);
  document.body.appendChild(veil);

  const start = performance.now();

  function frame(now: number) {
    const progress = Math.min((now - start) / MOTION_MS, 1);
    const eased = easeOutExpo(progress);
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
