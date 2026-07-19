/*
 * Case reading chrome: drives the navigation widget scroll state —
 * reading progress ring and scroll-top button reveal. The button appears
 * once the reader scrolls past the top zone and collapses back only when
 * they return to the top.
 * Only active on body[data-page="case"].
 */

/** Scroll-top button stays collapsed within this distance from the top */
const TOP_REVEAL_ZONE_PX = 120;

let scrollBound = false;
let ticking = false;

function isCasePage(): boolean {
  return document.body.dataset.page === "case";
}

function getScrollProgress(): number {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  if (max <= 0) return 100;
  return Math.min(100, Math.max(0, (window.scrollY / max) * 100));
}

function update() {
  ticking = false;

  if (!isCasePage()) return;

  const nav = document.querySelector<HTMLElement>("[data-navigation-widget]");
  if (!nav) return;

  nav.style.setProperty(
    "--nav-scroll-progress",
    getScrollProgress().toFixed(2)
  );
  nav.toggleAttribute("data-scrolled", window.scrollY > TOP_REVEAL_ZONE_PX);
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(update);
}

export function initCaseChrome() {
  if (!scrollBound) {
    scrollBound = true;
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  update();
}
