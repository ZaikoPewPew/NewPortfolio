import { isMobileViewport, prefersReducedMotion } from "../../../experience/motion/prefersReducedMotion";
import { feedback } from "../../../experience/feedback/FeedbackBus";
import { createWash, type WashController } from "../../../experience/wash/wash.client";
import {
  getCurrentlyBlock,
  resetCurrentlyBlock,
  type CurrentlyBlockActivateOptions,
} from "../../../components/ui/currentlyBlock.client";

type CaseFocusPortal = {
  root: HTMLElement;
  overlay: HTMLElement;
  wash: WashController | null;
};

let sharedPortal: CaseFocusPortal | null = null;
let elevateHost: HTMLDivElement | null = null;
let placeholder: HTMLDivElement | null = null;
let placeholderParent: HTMLElement | null = null;
let placeholderNext: Node | null = null;
const washByRoot = new WeakMap<HTMLElement, WashController>();

let activeCard: HTMLAnchorElement | null = null;
let isActive = false;
let documentPointerMoveBound: ((event: PointerEvent) => void) | null = null;

function isDisabled() {
  return prefersReducedMotion() || isMobileViewport();
}

function destroyPortal(portal: CaseFocusPortal) {
  portal.wash?.destroy();
  washByRoot.delete(portal.root);
  portal.root.remove();
}

function findPortalInDom(): CaseFocusPortal | null {
  document.querySelectorAll<HTMLElement>("[data-case-focus-overlay]").forEach((overlay) => {
    if (!overlay.closest("[data-case-focus-root]")) overlay.remove();
  });

  const roots = document.querySelectorAll<HTMLElement>("[data-case-focus-root]");
  roots.forEach((root, index) => {
    if (index < roots.length - 1) {
      washByRoot.get(root)?.destroy();
      washByRoot.delete(root);
      root.remove();
    }
  });

  const root = document.querySelector<HTMLElement>("[data-case-focus-root]");
  if (!root) return null;

  const overlay = root.querySelector<HTMLElement>("[data-case-focus-overlay]");
  if (!overlay) {
    destroyPortal({ root, overlay: root, wash: null });
    return null;
  }

  let wash = washByRoot.get(root) ?? null;
  const canvas = overlay.querySelector<HTMLCanvasElement>("[data-wash-canvas]");
  if (!wash && canvas && !prefersReducedMotion()) {
    wash = createWash(canvas);
    washByRoot.set(root, wash);
  }

  return { root, overlay, wash };
}

function createPortal(): CaseFocusPortal {
  const root = document.createElement("div");
  root.className = "case-focus-root";
  root.setAttribute("data-case-focus-root", "");
  root.setAttribute("aria-hidden", "true");

  const backdrop = document.createElement("div");
  backdrop.className = "case-focus__backdrop";
  backdrop.setAttribute("aria-hidden", "true");

  const overlay = document.createElement("div");
  overlay.className = "case-focus__overlay";
  overlay.setAttribute("data-case-focus-overlay", "");
  overlay.setAttribute("aria-hidden", "true");

  const washCanvas = document.createElement("canvas");
  washCanvas.className = "wash__canvas";
  washCanvas.setAttribute("data-wash-canvas", "");
  washCanvas.setAttribute("aria-hidden", "true");

  overlay.append(washCanvas);
  root.append(backdrop, overlay);
  document.body.append(root);

  let wash: WashController | null = null;
  if (!prefersReducedMotion()) {
    wash = createWash(washCanvas);
    washByRoot.set(root, wash);
  }

  return { root, overlay, wash };
}

function getSharedPortal(): CaseFocusPortal {
  if (sharedPortal && document.body.contains(sharedPortal.root)) {
    return sharedPortal;
  }
  sharedPortal = findPortalInDom() ?? createPortal();
  return sharedPortal;
}

function getElevateHost(): HTMLDivElement {
  if (elevateHost && document.body.contains(elevateHost)) return elevateHost;

  const existing = document.querySelector<HTMLDivElement>("[data-case-card-elevate]");
  if (existing) {
    elevateHost = existing;
    return existing;
  }

  elevateHost = document.createElement("div");
  elevateHost.className = "case-card-elevate";
  elevateHost.setAttribute("data-case-card-elevate", "");
  document.body.append(elevateHost);
  return elevateHost;
}

function snap(value: number) {
  const dpr = window.devicePixelRatio || 1;
  return Math.round(value * dpr) / dpr;
}

function syncElevatedPosition() {
  if (!elevateHost || !placeholder) return;

  const rect = placeholder.getBoundingClientRect();
  elevateHost.style.top = `${snap(rect.top)}px`;
  elevateHost.style.left = `${snap(rect.left)}px`;
  elevateHost.style.width = `${snap(rect.width)}px`;
  elevateHost.style.height = `${snap(rect.height)}px`;
}

function elevateCard(card: HTMLAnchorElement) {
  const host = getElevateHost();
  const rect = card.getBoundingClientRect();

  if (!placeholder) {
    placeholder = document.createElement("div");
    placeholder.className = "case-card-placeholder";
    placeholder.setAttribute("aria-hidden", "true");
  }

  placeholderParent = card.parentElement;
  placeholderNext = card.nextSibling;
  placeholderParent?.insertBefore(placeholder, card);
  placeholder.style.width = `${snap(rect.width)}px`;
  placeholder.style.height = `${snap(rect.height)}px`;

  host.style.top = `${snap(rect.top)}px`;
  host.style.left = `${snap(rect.left)}px`;
  host.style.width = `${snap(rect.width)}px`;
  host.style.height = `${snap(rect.height)}px`;

  host.append(card);
  card.classList.add("case-card--elevated");
  host.classList.add("is-visible");
}

function restoreCard(card: HTMLAnchorElement) {
  if (placeholderParent) {
    if (placeholderNext && placeholderNext.parentNode === placeholderParent) {
      placeholderParent.insertBefore(card, placeholderNext);
    } else {
      placeholderParent.append(card);
    }
  }

  card.classList.remove("case-card--elevated");
  placeholder?.remove();
  elevateHost?.classList.remove("is-visible");

  placeholderParent = null;
  placeholderNext = null;
}

function readBlockOptions(card: HTMLAnchorElement): CurrentlyBlockActivateOptions {
  return {
    videoSrc: card.dataset.hoverVideo,
  };
}

function bindDocumentPointerMove() {
  if (documentPointerMoveBound) return;

  documentPointerMoveBound = (event: PointerEvent) => {
    if (!isActive) return;
    moveCaseFocusPointer(event.clientX, event.clientY);
  };

  document.addEventListener("pointermove", documentPointerMoveBound, { passive: true });
}

function unbindDocumentPointerMove() {
  if (!documentPointerMoveBound) return;
  document.removeEventListener("pointermove", documentPointerMoveBound);
  documentPointerMoveBound = null;
}

const onScrollWhileActive = () => {
  syncElevatedPosition();
};

export function initCaseFocus() {
  if (isDisabled()) return;
  getSharedPortal();
  getCurrentlyBlock();
  getElevateHost();
}

export function activateCaseFocus(card: HTMLAnchorElement, clientX: number, clientY: number) {
  if (isDisabled()) return;

  const { wash } = getSharedPortal();
  const block = getCurrentlyBlock();

  if (isActive && activeCard === card) {
    block.movePointer(clientX, clientY);
    return;
  }

  if (isActive) {
    deactivateCaseFocus();
  }

  isActive = true;
  activeCard = card;

  elevateCard(card);
  wash?.setTintId("case");
  block.activate(clientX, clientY, readBlockOptions(card));
  feedback.emit({ sound: "hoverCard", source: "case.hover" });

  bindDocumentPointerMove();
  window.addEventListener("scroll", onScrollWhileActive, { passive: true });
}

export function moveCaseFocusPointer(clientX: number, clientY: number) {
  if (!isActive) return;
  getCurrentlyBlock().movePointer(clientX, clientY);
}

export function deactivateCaseFocus() {
  if (!isActive) return;

  isActive = false;
  unbindDocumentPointerMove();
  window.removeEventListener("scroll", onScrollWhileActive);

  if (activeCard) {
    restoreCard(activeCard);
    activeCard = null;
  }

  getCurrentlyBlock().deactivate();
}

export function resetCaseFocus() {
  deactivateCaseFocus();
  resetCurrentlyBlock();
}

export function isCaseFocusActive() {
  return isActive;
}
