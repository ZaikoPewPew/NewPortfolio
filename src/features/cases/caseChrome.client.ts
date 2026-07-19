/*
 * Case reading chrome: header + bottom navigation hide/show in sync.
 * Asymmetric — lazy down (accumulated px), near-instant up.
 * Only active on body[data-page="case"].
 */

/** Accumulated downward scroll before hiding */
const HIDE_AFTER_DOWN_PX = 72;
/** Accumulated upward scroll that reveals chrome */
const SHOW_AFTER_UP_PX = 3;
/** Always visible near the top of the case */
const TOP_REVEAL_ZONE_PX = 120;

let scrollBound = false;
let lastY = 0;
let downTravel = 0;
let upTravel = 0;
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

function getHeader(): HTMLElement | null {
  return document.querySelector<HTMLElement>("header.header");
}

function getNav(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-navigation-widget]");
}

function setChromeHidden(hidden: boolean) {
  const header = getHeader();
  const nav = getNav();

  if (header) {
    if (isCasePage()) {
      header.toggleAttribute("data-hidden", hidden);
    } else {
      header.removeAttribute("data-hidden");
    }
  }

  if (nav) {
    nav.toggleAttribute("data-hidden", hidden);
  }
}

function update() {
  ticking = false;

  if (!isCasePage()) {
    const header = getHeader();
    header?.removeAttribute("data-hidden");
    return;
  }

  const nav = getNav();
  const maxScroll = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight
  );
  /* Clamp out elastic overscroll: the rubber-band settle at the bottom
     reads as an upward delta and would falsely reveal the chrome. */
  const y = Math.min(Math.max(window.scrollY, 0), maxScroll);

  if (nav) {
    nav.style.setProperty(
      "--nav-scroll-progress",
      getScrollProgress().toFixed(2)
    );
  }

  const delta = y - lastY;
  lastY = y;

  /* Direction only decides visibility — no forced reveal at the bottom,
     chrome stays hidden until the reader actually scrolls up. */
  if (y <= TOP_REVEAL_ZONE_PX) {
    downTravel = 0;
    upTravel = 0;
    setChromeHidden(false);
    return;
  }

  if (delta > 0) {
    upTravel = 0;
    downTravel += delta;
    if (downTravel >= HIDE_AFTER_DOWN_PX) {
      setChromeHidden(true);
    }
  } else if (delta < 0) {
    downTravel = 0;
    upTravel += -delta;
    if (upTravel >= SHOW_AFTER_UP_PX) {
      setChromeHidden(false);
    }
  }
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
  lastY = window.scrollY;
  downTravel = 0;
  upTravel = 0;
  update();
}
