const CONTACT_ANIMATION_MS = 700;
const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

let animationTimer: number | undefined;

function isMobileViewport(): boolean {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  const layout = document.querySelector<HTMLElement>("[data-contact-layout]");
  const button = document.querySelector<HTMLButtonElement>("[data-contact-button]");
  const label = document.querySelector<HTMLElement>("[data-contact-button-label]");
  const keycap = document.querySelector<HTMLElement>("[data-contact-button-keycap-char]");
  const slot = document.querySelector<HTMLElement>("[data-contact-slot]");

  if (!layout || !button || !label || !keycap || !slot) return;

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
  const layout = document.querySelector<HTMLElement>("[data-contact-layout]");
  if (!layout) return false;
  if (layout.dataset.contactAnimating === "opening") return true;
  if (layout.dataset.contactAnimating === "closing") return true;
  return layout.dataset.contactOpen === "true";
}

export function toggleContactPanel(force?: boolean) {
  if (isMobileViewport()) return;

  const nextOpen = typeof force === "boolean" ? force : !isContactPanelOpen();
  setContactState(nextOpen, { animate: true });
}

export function bindContactPanel() {
  if (isMobileViewport()) return;

  const button = document.querySelector<HTMLButtonElement>("[data-contact-button]");
  if (!button) return;
  if (button.dataset.bound === "true") return;

  button.dataset.bound = "true";
  setContactState(false, { animate: false });

  button.addEventListener("click", () => {
    toggleContactPanel();
  });
}
