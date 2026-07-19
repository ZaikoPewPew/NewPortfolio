/** Ignore tiny scroll jitter (trackpad inertia) when toggling visibility */
const DIRECTION_THRESHOLD_PX = 8;
/** Never hide the menu within this distance from the top of the page */
const TOP_REVEAL_ZONE_PX = 120;

let scrollBound = false;
let lastY = 0;
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

  widget.style.setProperty(
    "--nav-scroll-progress",
    getScrollProgress().toFixed(2)
  );

  const delta = y - lastY;
  if (y <= TOP_REVEAL_ZONE_PX) {
    widget.removeAttribute("data-hidden");
  } else if (delta > DIRECTION_THRESHOLD_PX) {
    widget.setAttribute("data-hidden", "");
  } else if (delta < -DIRECTION_THRESHOLD_PX) {
    widget.removeAttribute("data-hidden");
  }
  if (Math.abs(delta) > DIRECTION_THRESHOLD_PX) lastY = y;
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
