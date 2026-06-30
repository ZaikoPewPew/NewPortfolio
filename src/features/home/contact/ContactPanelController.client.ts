const CONTACT_ANIMATION_MS = 700;
const MOBILE_MEDIA_QUERY = "(max-width: 639px)";
const CASE_CONTACT_ANIMATE_KEY = "case-contact-animate";

let animationTimer: number | undefined;
let clickBound = false;
let caseNavBound = false;

function isMobileViewport(): boolean {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getLayout(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-contact-layout]");
}

export function isContactLocked(): boolean {
  return getLayout()?.dataset.contactLocked === "true";
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

function updateContactUi(
  button: HTMLButtonElement,
  label: HTMLElement,
  keycap: HTMLElement,
  slot: HTMLElement,
  nextOpen: boolean
) {
  button.setAttribute("aria-expanded", String(nextOpen));
  label.textContent = nextOpen ? "about" : "contact";
  keycap.textContent = nextOpen ? "a" : "c";
  slot.setAttribute("aria-hidden", String(!nextOpen));
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
  if (isContactLocked() && !nextOpen) return;

  if (isAnimating(layout)) return;

  const wasOpen = layout.dataset.contactOpen === "true";
  if (wasOpen === nextOpen) return;

  updateContactUi(button, label, keycap, slot, nextOpen);

  if (animate) {
    startContactAnimation(layout, nextOpen);
  } else {
    clearContactAnimation(layout);
    layout.dataset.contactOpen = String(nextOpen);
  }
}

export function isContactPanelOpen(): boolean {
  const layout = getLayout();
  if (!layout) return false;
  if (layout.dataset.contactAnimating === "opening") return true;
  if (layout.dataset.contactAnimating === "closing") return true;
  return layout.dataset.contactOpen === "true";
}

export function toggleContactPanel(force?: boolean) {
  if (isMobileViewport() || isContactLocked()) return;

  const nextOpen = typeof force === "boolean" ? force : !isContactPanelOpen();
  setContactState(nextOpen, { animate: true });
}

function syncContactButtonLock() {
  const layout = getLayout();
  const button = document.querySelector<HTMLButtonElement>("[data-contact-button]");
  if (!layout || !button) return;

  const locked = layout.dataset.contactLocked === "true";
  button.disabled = locked;
  button.toggleAttribute("aria-disabled", locked);
  button.classList.toggle("contact-button--locked", locked);

  if (locked) {
    button.removeAttribute("data-feedback");
  } else {
    button.setAttribute("data-feedback", "tap");
  }
}

function syncContactPanelOnLoad() {
  if (isMobileViewport()) return;

  const layout = getLayout();
  if (!layout) return;

  syncContactButtonLock();

  const autoOpen = layout.dataset.contactAutoOpen === "true";
  if (!autoOpen) {
    setContactState(false, { animate: false });
    return;
  }

  const shouldAnimate = sessionStorage.getItem(CASE_CONTACT_ANIMATE_KEY) === "1";
  sessionStorage.removeItem(CASE_CONTACT_ANIMATE_KEY);

  if (shouldAnimate && !prefersReducedMotion()) {
    layout.dataset.contactOpen = "false";
    const button = document.querySelector<HTMLButtonElement>("[data-contact-button]");
    const label = document.querySelector<HTMLElement>("[data-contact-button-label]");
    const keycap = document.querySelector<HTMLElement>("[data-contact-button-keycap-char]");
    const slot = document.querySelector<HTMLElement>("[data-contact-slot]");
    if (button && label && keycap && slot) {
      updateContactUi(button, label, keycap, slot, false);
    }
    requestAnimationFrame(() => {
      setContactState(true, { animate: true });
    });
    return;
  }

  setContactState(true, { animate: false });
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

export function bindCaseContactNavigation() {
  if (caseNavBound) return;
  caseNavBound = true;

  document.addEventListener(
    "click",
    (e) => {
      const link = (e.target as HTMLElement).closest<HTMLElement>("[data-case-nav]");
      if (!link) return;
      sessionStorage.setItem(CASE_CONTACT_ANIMATE_KEY, "1");
    },
    true
  );
}

export function resetContactPanel() {
  const layout = getLayout();
  if (!layout) return;
  clearContactAnimation(layout);
  delete layout.dataset.contactOpen;
  delete layout.dataset.contactAnimating;
  delete layout.dataset.contactLocked;
  delete layout.dataset.contactAutoOpen;
}
