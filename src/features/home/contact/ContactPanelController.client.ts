import { getMessages } from "../../../i18n";
import { feedback } from "../../../experience/feedback/FeedbackBus";
import {
  CONTACT_PANEL_OPEN_KEY,
  CONTACT_WIDGETS_NAV_KEY,
  readSavedContactPanelOpen,
  resolveContactPanelOpen,
} from "./contact-panel.storage";
import { ensureProfileMenuOpenForContact } from "../profile-menu/profile-menu.client";

const CONTACT_ANIMATION_MS = 700;
const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

function contactButtonLabels() {
  return getMessages().me.contactButton;
}

type AstroTransitionEvent = Event & { to?: URL; newDocument?: Document };

type ContactButtonMode = "contact" | "about";

let animationTimer: number | undefined;
let clickBound = false;
let persistenceBound = false;
let widgetsNavLockBound = false;
let profileOpenPending = false;

function isMobileViewport(): boolean {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stripLocalePrefix(pathname: string): string {
  const stripped = pathname.replace(/^\/ru(?=\/|$)/, "");
  return stripped.length > 0 ? stripped : "/";
}

function isCasePath(pathname: string): boolean {
  return /\/cases\/[^/]+\/?$/.test(stripLocalePrefix(pathname));
}

function isWidgetsPath(pathname: string): boolean {
  const path = stripLocalePrefix(pathname);
  return path === "/" || isCasePath(pathname);
}

function getLayout(root: ParentNode = document): HTMLElement | null {
  return root.querySelector<HTMLElement>("[data-contact-layout]");
}

function clearContactAnimation(layout: HTMLElement) {
  if (animationTimer !== undefined) {
    window.clearTimeout(animationTimer);
    animationTimer = undefined;
  }
  delete layout.dataset.contactAnimating;
}

function isAnimating(layout: HTMLElement): boolean {
  return layout.dataset.contactAnimating === "opening" || layout.dataset.contactAnimating === "closing";
}

function getContactButtonMode(open: boolean): ContactButtonMode {
  return open ? "about" : "contact";
}

function updateContactButtons(root: ParentNode, mode: ContactButtonMode) {
  const labels = contactButtonLabels();

  root.querySelectorAll<HTMLButtonElement>("[data-contact-button]").forEach((button) => {
    const label = button.querySelector<HTMLElement>("[data-contact-button-label]");
    const keycap = button.querySelector<HTMLElement>("[data-contact-button-keycap-char]");
    if (!label || !keycap) return;

    button.setAttribute("aria-expanded", String(mode === "about"));
    label.textContent = mode === "about" ? labels.about : labels.contact;
    keycap.textContent = mode === "about" ? "c" : "h";
  });

  const slot = root.querySelector<HTMLElement>("[data-contact-slot]");
  if (slot) slot.setAttribute("aria-hidden", String(mode === "contact"));
}

function readLayoutOpen(layout: HTMLElement): boolean {
  return layout.dataset.contactOpen === "true";
}

function lockContactPanelVisual(layout: HTMLElement, open: boolean) {
  const root = layout.ownerDocument;
  root.documentElement.dataset.contactPanelNav = open ? "open" : "closed";

  layout.dataset.contactNavLock = open ? "open" : "closed";
  layout.dataset.contactOpen = String(open);
  delete layout.dataset.contactAnimating;
  layout.style.viewTransitionName = "none";

  if (root.querySelector("[data-contact-button]") && root.querySelector("[data-contact-slot]")) {
    updateContactButtons(root, getContactButtonMode(open));
  }
}

function unlockContactPanelVisual(layout: HTMLElement) {
  delete layout.ownerDocument.documentElement.dataset.contactPanelNav;
  delete layout.dataset.contactNavLock;
  layout.style.removeProperty("view-transition-name");
}

function applyContactStateToDocument(doc: Document, open: boolean) {
  const layout = getLayout(doc);
  if (!layout || !doc.querySelector("[data-contact-button]") || !doc.querySelector("[data-contact-slot]")) {
    return;
  }

  clearContactAnimation(layout);
  doc.documentElement.dataset.contactPanelNav = open ? "open" : "closed";
  lockContactPanelVisual(layout, open);
  updateContactButtons(doc, getContactButtonMode(open));
}

function writeContactPanelOpen(open: boolean) {
  sessionStorage.setItem(CONTACT_PANEL_OPEN_KEY, open ? "1" : "0");
}

function saveContactPanelState() {
  writeContactPanelOpen(isContactPanelOpen());
}

function ensureContactPanelStateTracked() {
  if (readSavedContactPanelOpen() !== null) return;
  saveContactPanelState();
}

export function beginWidgetsNavigationLock() {
  const layout = getLayout();
  if (!layout) return;

  clearContactAnimation(layout);

  const open = isContactPanelOpen();
  writeContactPanelOpen(open);
  sessionStorage.setItem(CONTACT_WIDGETS_NAV_KEY, "1");
  lockContactPanelVisual(layout, open);
}

function startContactAnimation(layout: HTMLElement, nextOpen: boolean) {
  clearContactAnimation(layout);
  if (prefersReducedMotion()) {
    layout.dataset.contactOpen = String(nextOpen);
    return;
  }

  layout.dataset.contactAnimating = nextOpen ? "opening" : "closing";

  animationTimer = window.setTimeout(() => {
    layout.dataset.contactOpen = String(nextOpen);
    delete layout.dataset.contactAnimating;
    animationTimer = undefined;
  }, CONTACT_ANIMATION_MS);
}

function setContactState(nextOpen: boolean, options: { animate?: boolean } = {}) {
  const { animate = true } = options;
  const layout = getLayout();

  if (
    !layout ||
    !document.querySelector("[data-contact-button]") ||
    !document.querySelector("[data-contact-slot]")
  ) {
    return;
  }
  if (isAnimating(layout)) return;

  const wasOpen = readLayoutOpen(layout);
  if (wasOpen === nextOpen) return;

  if (animate) {
    feedback.emit({ sound: "swipe", haptic: "light", source: "contact.panel" });
  }

  delete layout.dataset.contactNavLock;
  layout.style.removeProperty("view-transition-name");
  updateContactButtons(document, getContactButtonMode(nextOpen));

  if (animate) {
    startContactAnimation(layout, nextOpen);
  } else {
    clearContactAnimation(layout);
    layout.dataset.contactOpen = String(nextOpen);
  }

  writeContactPanelOpen(nextOpen);
}

export function isContactPanelOpen(): boolean {
  const layout = getLayout();
  if (!layout) return false;
  if (layout.dataset.contactAnimating === "opening") return true;
  if (layout.dataset.contactAnimating === "closing") return true;
  return readLayoutOpen(layout);
}

export function toggleContactPanel(force?: boolean) {
  if (isMobileViewport()) return;

  if (profileOpenPending) return;
  profileOpenPending = true;

  void ensureProfileMenuOpenForContact().then(() => {
    const nextOpen =
      typeof force === "boolean" ? force : !isContactPanelOpen();
    setContactState(nextOpen, { animate: true });
  }).finally(() => {
    profileOpenPending = false;
  });
}

function syncContactPanelOnLoad() {
  if (isMobileViewport()) return;

  const layout = getLayout();
  if (!layout) return;

  const hasContactUi =
    Boolean(document.querySelector("[data-contact-button]")) &&
    Boolean(document.querySelector("[data-contact-slot]"));

  if (sessionStorage.getItem(CONTACT_WIDGETS_NAV_KEY) === "1") {
    sessionStorage.removeItem(CONTACT_WIDGETS_NAV_KEY);
    unlockContactPanelVisual(layout);

    if (hasContactUi) {
      updateContactButtons(document, getContactButtonMode(readLayoutOpen(layout)));
    }
    return;
  }

  ensureContactPanelStateTracked();

  const targetOpen = resolveContactPanelOpen();
  unlockContactPanelVisual(layout);

  if (readLayoutOpen(layout) !== targetOpen && !isAnimating(layout)) {
    setContactState(targetOpen, { animate: false });
    return;
  }

  if (hasContactUi) {
    updateContactButtons(document, getContactButtonMode(targetOpen));
  }
}

export function bindContactPanel() {
  if (isMobileViewport()) return;

  if (!clickBound) {
    clickBound = true;
    document.addEventListener("click", (e) => {
      const button = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-contact-button]");
      if (!button || button.disabled) return;
      toggleContactPanel();
    });
  }

  syncContactPanelOnLoad();
}

function bindWidgetsNavigationLock() {
  if (widgetsNavLockBound) return;
  widgetsNavLockBound = true;

  document.addEventListener(
    "click",
    (event) => {
      if (isMobileViewport()) return;

      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (!isWidgetsPath(window.location.pathname) || !isWidgetsPath(destination.pathname)) return;
      if (destination.pathname === window.location.pathname) return;

      beginWidgetsNavigationLock();
    },
    true
  );
}

export function bindContactPanelPersistence() {
  if (persistenceBound) return;
  persistenceBound = true;

  bindWidgetsNavigationLock();

  document.addEventListener("astro:before-swap", (event) => {
    const swapEvent = event as AstroTransitionEvent;
    const newDocument = swapEvent.newDocument;
    const open = resolveContactPanelOpen();

    document.documentElement.dataset.contactPanelNav = open ? "open" : "closed";

    const layout = getLayout();
    if (layout) {
      lockContactPanelVisual(layout, open);
    }

    if (!newDocument || !getLayout(newDocument)) return;
    applyContactStateToDocument(newDocument, open);
  });
}

export function resetContactPanel() {
  const layout = getLayout();
  if (!layout) return;
  clearContactAnimation(layout);
  unlockContactPanelVisual(layout);
  delete document.documentElement.dataset.contactPanelNav;
  delete layout.dataset.contactOpen;
  delete layout.dataset.contactAnimating;
}

export function prepareContactPanelForNavigation(to?: URL) {
  const layout = getLayout();
  if (!layout) return;

  if (to && isWidgetsPath(to.pathname)) {
    beginWidgetsNavigationLock();
    return;
  }

  writeContactPanelOpen(isContactPanelOpen());
  clearContactAnimation(layout);
  unlockContactPanelVisual(layout);
  delete document.documentElement.dataset.contactPanelNav;
  delete layout.dataset.contactOpen;
  delete layout.dataset.contactAnimating;
}
