/*
 * Hide/show follows the asymmetric pattern used by article sites and
 * mobile browser toolbars: hiding needs sustained downward reading
 * (accumulated distance), showing reacts to the first clear upward move.
 */
/** Accumulated downward scroll before hiding — forgives jitter and short adjustments */
const HIDE_AFTER_DOWN_PX = 72;
/** Upward scroll that reveals the menu — near-instant response to intent */
const SHOW_AFTER_UP_PX = 8;
/** Never hide the menu within this distance from the top of the page */
const TOP_REVEAL_ZONE_PX = 120;
/** Reveal near the end of the case — natural pause point for navigation */
const BOTTOM_REVEAL_ZONE_PX = 160;

let scrollBound = false;
let lastY = 0;
let downTravel = 0;
let ticking = false;

function getScrollProgress(): number {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  if (max <= 0) return 100;
  return Math.min(100, Math.max(0, (window.scrollY / max) * 100));
}

/* Widget is re-created on View Transitions navigation — query it live
   instead of capturing the element in the listener. */
function update() {
  ticking = false;
  const widget = document.querySelector<HTMLElement>(
    "[data-navigation-widget]"
  );
  if (!widget) return;

  const y = window.scrollY;
  const doc = document.documentElement;
  const maxScroll = doc.scrollHeight - window.innerHeight;

  widget.style.setProperty(
    "--nav-scroll-progress",
    getScrollProgress().toFixed(2)
  );

  const delta = y - lastY;
  lastY = y;

  const nearTop = y <= TOP_REVEAL_ZONE_PX;
  const nearBottom = maxScroll - y <= BOTTOM_REVEAL_ZONE_PX;

  if (nearTop || nearBottom) {
    downTravel = 0;
    widget.removeAttribute("data-hidden");
    return;
  }

  if (delta > 0) {
    downTravel += delta;
    if (downTravel >= HIDE_AFTER_DOWN_PX) {
      widget.setAttribute("data-hidden", "");
    }
  } else if (delta < -SHOW_AFTER_UP_PX) {
    downTravel = 0;
    widget.removeAttribute("data-hidden");
  }
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(update);
}

export function initNavigationWidget(root: ParentNode = document) {
  if (!scrollBound) {
    scrollBound = true;
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  lastY = window.scrollY;
  update();

  root
    .querySelectorAll<HTMLElement>("[data-navigation-scroll-top]")
    .forEach((btn) => {
      if (btn.hasAttribute("data-bound")) return;
      btn.setAttribute("data-bound", "true");

      btn.addEventListener("click", () => {
        const behavior: ScrollBehavior = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
          ? "auto"
          : "smooth";
        window.scrollTo({ top: 0, behavior });
      });
    });
}
