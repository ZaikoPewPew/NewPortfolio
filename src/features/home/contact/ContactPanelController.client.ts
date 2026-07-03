import { getMessages } from "../../../i18n";

const CONTACT_ANIMATION_MS = 700;
const MOBILE_MEDIA_QUERY = "(max-width: 639px)";
const CONTACT_PANEL_OPEN_KEY = "contact-panel-open";
const CONTACT_WIDGETS_NAV_KEY = "contact-widgets-nav";
const DEFAULT_CONTACT_PANEL_OPEN = false;

const contactButtonLabels = getMessages().me.contactButton;

type AstroTransitionEvent = Event & { to?: URL; newDocument?: Document };

type ContactButtonMode = "contact" | "about";

let animationTimer: number | undefined;
let clickBound = false;
let persistenceBound = false;
let widgetsNavLockBound = false;

function isMobileViewport(): boolean {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isCasePath(pathname: string): boolean {
  return /\/cases\/[^/]+\/?$/.test(pathname);
}

function isWidgetsPath(pathname: string): boolean {
  return pathname === "/" || isCasePath(pathname);
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

function updateContactUi(
  button: HTMLButtonElement,
  label: HTMLElement,
  keycap: HTMLElement,
  slot: HTMLElement,
  mode: ContactButtonMode
) {
  button.setAttribute("aria-expanded", String(mode === "about"));
  label.textContent = mode === "about" ? contactButtonLabels.about : contactButtonLabels.contact;
  keycap.textContent = mode === "about" ? "c" : "h";
  slot.setAttribute("aria-hidden", String(mode === "contact"));
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

  const button = root.querySelector<HTMLButtonElement>("[data-contact-button]");
  const label = root.querySelector<HTMLElement>("[data-contact-button-label]");
  const keycap = root.querySelector<HTMLElement>("[data-contact-button-keycap-char]");
  const ariaSlot = root.querySelector<HTMLElement>("[data-contact-slot]");
  if (button && label && keycap && ariaSlot) {
    updateContactUi(button, label, keycap, ariaSlot, getContactButtonMode(open));
  }
}

function unlockContactPanelVisual(layout: HTMLElement) {
  delete layout.ownerDocument.documentElement.dataset.contactPanelNav;
  delete layout.dataset.contactNavLock;
  layout.style.removeProperty("view-transition-name");
}

function applyContactStateToDocument(doc: Document, open: boolean) {
  const layout = getLayout(doc);
  const button = doc.querySelector<HTMLButtonElement>("[data-contact-button]");
  const label = doc.querySelector<HTMLElement>("[data-contact-button-label]");
  const keycap = doc.querySelector<HTMLElement>("[data-contact-button-keycap-char]");
  const slot = doc.querySelector<HTMLElement>("[data-contact-slot]");
  if (!layout || !button || !label || !keycap || !slot) return;

  clearContactAnimation(layout);
  doc.documentElement.dataset.contactPanelNav = open ? "open" : "closed";
  lockContactPanelVisual(layout, open);
  updateContactUi(button, label, keycap, slot, getContactButtonMode(open));
}

function writeContactPanelOpen(open: boolean) {
  sessionStorage.setItem(CONTACT_PANEL_OPEN_KEY, open ? "1" : "0");
}

function readSavedContactPanelOpen(): boolean | null {
  const value = sessionStorage.getItem(CONTACT_PANEL_OPEN_KEY);
  if (value === null) return null;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return null;
}

function resolveContactPanelOpen(): boolean {
  return readSavedContactPanelOpen() ?? DEFAULT_CONTACT_PANEL_OPEN;
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
  const button = document.querySelector<HTMLButtonElement>("[data-contact-button]");
  const label = document.querySelector<HTMLElement>("[data-contact-button-label]");
  const keycap = document.querySelector<HTMLElement>("[data-contact-button-keycap-char]");
  const slot = document.querySelector<HTMLElement>("[data-contact-slot]");

  if (!layout || !button || !label || !keycap || !slot) return;
  if (isAnimating(layout)) return;

  const wasOpen = readLayoutOpen(layout);
  if (wasOpen === nextOpen) return;

  delete layout.dataset.contactNavLock;
  layout.style.removeProperty("view-transition-name");
  updateContactUi(button, label, keycap, slot, getContactButtonMode(nextOpen));

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

  const nextOpen = typeof force === "boolean" ? force : !isContactPanelOpen();
  setContactState(nextOpen, { animate: true });
}

function syncContactPanelOnLoad() {
  if (isMobileViewport()) return;

  const layout = getLayout();
  if (!layout) return;

  if (sessionStorage.getItem(CONTACT_WIDGETS_NAV_KEY) === "1") {
    sessionStorage.removeItem(CONTACT_WIDGETS_NAV_KEY);
    unlockContactPanelVisual(layout);

    const button = document.querySelector<HTMLButtonElement>("[data-contact-button]");
    const label = document.querySelector<HTMLElement>("[data-contact-button-label]");
    const keycap = document.querySelector<HTMLElement>("[data-contact-button-keycap-char]");
    const slot = document.querySelector<HTMLElement>("[data-contact-slot]");
    if (button && label && keycap && slot) {
      updateContactUi(button, label, keycap, slot, getContactButtonMode(readLayoutOpen(layout)));
    }
    return;
  }

  ensureContactPanelStateTracked();

  const targetOpen = resolveContactPanelOpen();
  if (readLayoutOpen(layout) === targetOpen && !isAnimating(layout)) return;

  setContactState(targetOpen, { animate: false });
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
