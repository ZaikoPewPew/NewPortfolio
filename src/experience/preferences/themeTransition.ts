import { prefersReducedMotion } from "../motion/prefersReducedMotion";
import { getNextTheme, userPreferences, type ThemeMode } from "./UserPreferences";

export interface ThemeTransitionOrigin {
  x: number;
  y: number;
}

const MOTION_MS = 480;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

function maxRevealRadius(x: number, y: number): number {
  return Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
}

function supportsViewTransitions(): boolean {
  return typeof document.startViewTransition === "function";
}

function runViewTransitionReveal(
  x: number,
  y: number,
  nextTheme: ThemeMode
): ThemeMode {
  const radius = maxRevealRadius(x, y);

  const transition = document.startViewTransition(() => {
    userPreferences.set({ theme: nextTheme });
  });

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: MOTION_MS,
          easing: EASING,
          pseudoElement: "::view-transition-new(root)",
        }
      );
    })
    .catch(() => {
      // Skipped or interrupted (e.g. rapid toggling) — theme already applied.
    });

  return nextTheme;
}

function runCircleRevealFallback(
  x: number,
  y: number,
  nextTheme: ThemeMode
): ThemeMode {
  const radius = maxRevealRadius(x, y);

  userPreferences.set({ theme: nextTheme });

  const veil = document.createElement("div");
  veil.className = "theme-switch-veil";
  veil.setAttribute("data-theme", nextTheme);
  document.body.appendChild(veil);

  const anim = veil.animate(
    [
      { clipPath: `circle(0px at ${x}px ${y}px)` },
      { clipPath: `circle(${radius}px at ${x}px ${y}px)` },
    ],
    {
      duration: MOTION_MS,
      easing: EASING,
      fill: "forwards",
    }
  );

  anim.onfinish = () => veil.remove();
  window.setTimeout(() => veil.remove(), MOTION_MS + 100);

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

  if (supportsViewTransitions()) {
    return runViewTransitionReveal(origin.x, origin.y, nextTheme);
  }

  return runCircleRevealFallback(origin.x, origin.y, nextTheme);
}
