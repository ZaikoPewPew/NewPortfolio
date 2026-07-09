import { isMobileViewport, prefersReducedMotion } from "../../../experience/motion/prefersReducedMotion";
import { feedback } from "../../../experience/feedback/FeedbackBus";
import {
  getCurrentlyBlock,
  resetCurrentlyBlock,
  type CurrentlyBlockActivateOptions,
} from "../../../components/ui/currentlyBlock.client";
import {
  activateCaseCursor,
  deactivateCaseCursor,
  initCaseCursor,
  moveCaseCursor,
  resetCaseCursor,
} from "./caseCursor.client";

let activeCard: HTMLAnchorElement | null = null;
let isActive = false;
let documentPointerMoveBound: ((event: PointerEvent) => void) | null = null;

function isDisabled() {
  return prefersReducedMotion() || isMobileViewport();
}

function readBlockOptions(card: HTMLAnchorElement): CurrentlyBlockActivateOptions {
  return {
    videoSrc: card.dataset.hoverVideo,
    imageSrc: card.dataset.hoverImage,
    restart: true,
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

export function initCaseFocus() {
  if (isDisabled()) return;
  initCaseCursor();
  getCurrentlyBlock();
}

export function activateCaseFocus(card: HTMLAnchorElement, clientX: number, clientY: number) {
  if (isDisabled()) return;

  const block = getCurrentlyBlock();

  if (isActive && activeCard === card) {
    block.movePointer(clientX, clientY);
    moveCaseCursor(clientX, clientY);
    return;
  }

  if (isActive) {
    deactivateCaseFocus();
  }

  isActive = true;
  activeCard = card;

  block.activate(clientX, clientY, readBlockOptions(card));
  activateCaseCursor(clientX, clientY);
  feedback.emit({ sound: "hoverCard", source: "case.hover" });

  bindDocumentPointerMove();
}

export function moveCaseFocusPointer(clientX: number, clientY: number) {
  if (!isActive) return;
  getCurrentlyBlock().movePointer(clientX, clientY);
  moveCaseCursor(clientX, clientY);
}

export function deactivateCaseFocus() {
  if (!isActive) return;

  isActive = false;
  unbindDocumentPointerMove();
  activeCard = null;

  getCurrentlyBlock().deactivate();
  deactivateCaseCursor();
}

export function resetCaseFocus() {
  deactivateCaseFocus();
  resetCaseCursor();
  resetCurrentlyBlock();
}

export function isCaseFocusActive() {
  return isActive;
}
