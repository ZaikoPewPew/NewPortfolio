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
/** Always visible near the end — natural pause for navigation */
const BOTTOM_REVEAL_ZONE_PX = 160;

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

/** Keep chrome up while theme menu is open or focus is inside the header */
function shouldPinChrome(header: HTMLElement | null): boolean {
  if (!header) return false;
  if (header.matches(":focus-within")) return true;
  return Boolean(header.querySelector("[data-theme-widget][data-open]"));
}

function setChromeHidden(hidden: boolean) {
  const header = getHeader();
  const nav = getNav();

  if (hidden && shouldPinChrome(header)) {
    hidden = false;
  }

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

function revealChrome() {
  downTravel = 0;
  upTravel = 0;
  setChromeHidden(false);
}

function update() {
  ticking = false;

  if (!isCasePage()) {
    const header = getHeader();
    header?.removeAttribute("data-hidden");
    return;
  }

  const nav = getNav();
  const y = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  if (nav) {
    nav.style.setProperty(
      "--nav-scroll-progress",
      getScrollProgress().toFixed(2)
    );
  }

  const delta = y - lastY;
  lastY = y;

  const nearTop = y <= TOP_REVEAL_ZONE_PX;
  const nearBottom = maxScroll - y <= BOTTOM_REVEAL_ZONE_PX;

  if (nearTop || nearBottom || shouldPinChrome(getHeader())) {
    revealChrome();
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
