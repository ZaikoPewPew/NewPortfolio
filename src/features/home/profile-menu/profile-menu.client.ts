import {
  resolveProfileMenuOpen,
  writeProfileMenuOpen,
} from "./profile-menu.storage";

const OPEN_SETTLE_MS = 880;
const CLOSE_SETTLE_MS = 360;

let settleTimer: number | undefined;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isDesktopProfileMenu() {
  return window.matchMedia("(min-width: 640px)").matches;
}

function getHome(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-home-page]");
}

function getMenu(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-profile-menu]");
}

function clearSettleTimer() {
  if (settleTimer !== undefined) {
    window.clearTimeout(settleTimer);
    settleTimer = undefined;
  }
}

function syncTrigger(menu: HTMLElement, open: boolean) {
  const trigger = menu.querySelector<HTMLElement>("[data-profile-menu-trigger]");
  const panel = menu.querySelector<HTMLElement>("[data-profile-menu-panel]");
  if (!trigger) return;

  trigger.setAttribute("aria-expanded", open ? "true" : "false");
  trigger.setAttribute(
    "aria-label",
    open
      ? (menu.getAttribute("data-close-label") ?? "Close")
      : (menu.getAttribute("data-open-label") ?? "Open")
  );

  if (panel) {
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    panel.toggleAttribute("inert", !open);
  }
}

function syncBentoInert(menu: HTMLElement, open: boolean) {
  const bento = menu.querySelector<HTMLElement>("[data-profile-bento]");
  if (!bento) return;
  bento.toggleAttribute("inert", !open);
}

export function isProfileMenuOpen(): boolean {
  const home = getHome();
  if (!home) return false;
  return home.getAttribute("data-profile-open") === "true";
}

export function setProfileMenuOpen(
  open: boolean,
  {
    animate = true,
    restoreFocus = false,
  }: { animate?: boolean; restoreFocus?: boolean } = {}
) {
  const home = getHome();
  const menu = getMenu();
  if (!home || !menu) return;

  if (!isDesktopProfileMenu()) {
    home.setAttribute("data-profile-open", "true");
    menu.toggleAttribute("data-open", true);
    syncTrigger(menu, true);
    syncBentoInert(menu, true);
    return;
  }

  const prev = home.getAttribute("data-profile-open") === "true";
  if (prev === open) {
    syncTrigger(menu, open);
    syncBentoInert(menu, open);
    return;
  }

  clearSettleTimer();
  home.removeAttribute("data-profile-settled");

  const shouldAnimate = animate && !prefersReducedMotion();
  if (shouldAnimate) {
    home.setAttribute("data-profile-animating", open ? "opening" : "closing");
  }

  home.setAttribute("data-profile-open", String(open));
  menu.toggleAttribute("data-open", open);
  syncTrigger(menu, open);
  writeProfileMenuOpen(open);

  if (open) syncBentoInert(menu, true);

  if (shouldAnimate) {
    settleTimer = window.setTimeout(() => {
      home.removeAttribute("data-profile-animating");
      home.setAttribute("data-profile-settled", "");
      if (!open) syncBentoInert(menu, false);
      settleTimer = undefined;
    }, open ? OPEN_SETTLE_MS : CLOSE_SETTLE_MS);
  } else {
    home.removeAttribute("data-profile-animating");
    home.setAttribute("data-profile-settled", "");
    syncBentoInert(menu, open);
  }

  if (!open && restoreFocus) {
    menu.querySelector<HTMLElement>("[data-profile-menu-trigger]")?.focus();
  }
}

export function toggleProfileMenu(force?: boolean) {
  const next = typeof force === "boolean" ? force : !isProfileMenuOpen();
  setProfileMenuOpen(next);
}

/**
 * ContactPanelController waits for the panel entrance before it animates
 * widgets horizontally. This keeps transform ownership unambiguous.
 */
export function ensureProfileMenuOpenForContact(): Promise<void> {
  const home = getHome();
  if (!home || !isDesktopProfileMenu()) return Promise.resolve();

  if (
    isProfileMenuOpen() &&
    !home.hasAttribute("data-profile-animating")
  ) {
    return Promise.resolve();
  }

  setProfileMenuOpen(true);
  return new Promise((resolve) => {
    window.setTimeout(resolve, OPEN_SETTLE_MS);
  });
}

export function bindProfileMenu() {
  const home = getHome();
  const menu = getMenu();
  if (!home || !menu || menu.hasAttribute("data-menu-bound")) return;
  menu.setAttribute("data-menu-bound", "true");

  const trigger = menu.querySelector<HTMLElement>("[data-profile-menu-trigger]");
  if (!trigger) return;

  trigger.addEventListener("click", () => {
    if (!isDesktopProfileMenu()) return;
    toggleProfileMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isProfileMenuOpen()) return;
    if (!isDesktopProfileMenu()) return;
    setProfileMenuOpen(false, { restoreFocus: true });
  });
}

export function syncProfileMenuOnLoad() {
  const home = getHome();
  const menu = getMenu();
  if (!home || !menu) return;

  if (!isDesktopProfileMenu()) {
    home.setAttribute("data-profile-open", "true");
    menu.toggleAttribute("data-open", true);
    syncTrigger(menu, true);
    syncBentoInert(menu, true);
    home.removeAttribute("data-profile-animating");
    home.setAttribute("data-profile-settled", "");
    return;
  }

  const contactOpen =
    menu.querySelector<HTMLElement>("[data-contact-layout]")?.dataset
      .contactOpen === "true";
  const open = resolveProfileMenuOpen() || contactOpen;
  home.setAttribute("data-profile-open", String(open));
  menu.toggleAttribute("data-open", open);
  syncTrigger(menu, open);
  syncBentoInert(menu, open);
  home.removeAttribute("data-profile-animating");
  home.setAttribute("data-profile-settled", "");
}
