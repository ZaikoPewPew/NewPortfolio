import {
  resolveProfileMenuOpen,
  writeProfileMenuOpen,
  readSayHiDismissed,
  writeSayHiDismissed,
} from "./profile-menu.storage";
import { resetSayHiParticles } from "../say-hi/sayHiParticles.client";

const OPEN_SETTLE_MS = 880;
const CLOSE_SETTLE_MS = 360;

let settleTimer: number | undefined;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isDesktopProfileMenu() {
  return window.matchMedia("(min-width: 640px)").matches;
}

/** Profile state host — home or case page main. */
function getProfileHost(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    "[data-home-page], [data-case-page]"
  );
}

function getMenu(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-profile-menu]");
}

/** The "say hi" hint only teaches that the avatar is clickable. Once the profile
    has been opened, retire it permanently (particles + static span). */
function dismissSayHi(menu: HTMLElement) {
  if (menu.hasAttribute("data-say-hi-dismissed")) return;
  menu.setAttribute("data-say-hi-dismissed", "");
  writeSayHiDismissed();
  resetSayHiParticles();
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
  const host = getProfileHost();
  if (!host) return false;
  return host.getAttribute("data-profile-open") === "true";
}

export function setProfileMenuOpen(
  open: boolean,
  {
    animate = true,
    restoreFocus = false,
  }: { animate?: boolean; restoreFocus?: boolean } = {}
) {
  const host = getProfileHost();
  const menu = getMenu();
  if (!host || !menu) return;

  if (!isDesktopProfileMenu()) {
    host.setAttribute("data-profile-open", "true");
    menu.toggleAttribute("data-open", true);
    syncTrigger(menu, true);
    syncBentoInert(menu, true);
    return;
  }

  const prev = host.getAttribute("data-profile-open") === "true";
  if (prev === open) {
    syncTrigger(menu, open);
    syncBentoInert(menu, open);
    return;
  }

  clearSettleTimer();
  host.removeAttribute("data-profile-settled");

  const shouldAnimate = animate && !prefersReducedMotion();
  if (shouldAnimate) {
    host.setAttribute("data-profile-animating", open ? "opening" : "closing");
  }

  host.setAttribute("data-profile-open", String(open));
  menu.toggleAttribute("data-open", open);
  syncTrigger(menu, open);
  writeProfileMenuOpen(open);

  if (open) {
    dismissSayHi(menu);
    syncBentoInert(menu, true);
  }

  if (shouldAnimate) {
    settleTimer = window.setTimeout(() => {
      host.removeAttribute("data-profile-animating");
      host.setAttribute("data-profile-settled", "");
      if (!open) syncBentoInert(menu, false);
      settleTimer = undefined;
    }, open ? OPEN_SETTLE_MS : CLOSE_SETTLE_MS);
  } else {
    host.removeAttribute("data-profile-animating");
    host.setAttribute("data-profile-settled", "");
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
  const host = getProfileHost();
  if (!host || !isDesktopProfileMenu()) return Promise.resolve();

  if (
    isProfileMenuOpen() &&
    !host.hasAttribute("data-profile-animating")
  ) {
    return Promise.resolve();
  }

  setProfileMenuOpen(true);
  return new Promise((resolve) => {
    window.setTimeout(resolve, OPEN_SETTLE_MS);
  });
}

export function bindProfileMenu() {
  const host = getProfileHost();
  const menu = getMenu();
  if (!host || !menu || menu.hasAttribute("data-menu-bound")) return;
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

  document.addEventListener("pointerdown", (event) => {
    if (!isDesktopProfileMenu() || !isProfileMenuOpen()) return;

    const currentMenu = getMenu();
    if (!currentMenu) return;

    const target = event.target as Node | null;
    if (target && currentMenu.contains(target)) return;

    setProfileMenuOpen(false);
  });
}

export function syncProfileMenuOnLoad() {
  const host = getProfileHost();
  const menu = getMenu();
  if (!host || !menu) return;

  if (!isDesktopProfileMenu()) {
    host.setAttribute("data-profile-open", "true");
    menu.toggleAttribute("data-open", true);
    syncTrigger(menu, true);
    syncBentoInert(menu, true);
    host.removeAttribute("data-profile-animating");
    host.setAttribute("data-profile-settled", "");
    return;
  }

  const open = resolveProfileMenuOpen();
  host.setAttribute("data-profile-open", String(open));
  menu.toggleAttribute("data-open", open);
  syncTrigger(menu, open);
  syncBentoInert(menu, open);
  host.removeAttribute("data-profile-animating");
  host.setAttribute("data-profile-settled", "");

  if (open || readSayHiDismissed()) dismissSayHi(menu);
}
