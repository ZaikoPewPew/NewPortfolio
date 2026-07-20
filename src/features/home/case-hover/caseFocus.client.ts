import { isMobileViewport, prefersReducedMotion } from "../../../experience/motion/prefersReducedMotion";
import { feedback } from "../../../experience/feedback/FeedbackBus";
import {
  getCurrentlyBlock,
  resetCurrentlyBlock,
  type CurrentlyBlockActivateOptions,
} from "../../../components/ui/currentlyBlock.client";

let activeTarget: HTMLElement | null = null;
let isActive = false;
let documentPointerMoveBound: ((event: PointerEvent) => void) | null = null;

function isDisabled() {
  return prefersReducedMotion() || isMobileViewport();
}

function readBlockOptions(target: HTMLElement): CurrentlyBlockActivateOptions {
  const isCompanyLink = target.hasAttribute("data-case-company-link");

  return {
    videoSrc: target.dataset.hoverVideo,
    imageSrc: target.dataset.hoverImage,
    restart: !isCompanyLink,
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
  getCurrentlyBlock();
}

export function activateCaseFocus(
  target: HTMLElement,
  clientX: number,
  clientY: number,
  options: { skipFeedback?: boolean } = {}
) {
  if (isDisabled()) return;

  const block = getCurrentlyBlock();

  if (isActive && activeTarget === target) {
    bindDocumentPointerMove();
    block.movePointer(clientX, clientY);
    return;
  }

  const switching = isActive && activeTarget !== target;
  if (switching) {
    activeTarget?.classList.remove("is-case-title-active");
    activeTarget = target;
    target.classList.add("is-case-title-active");
    block.activate(clientX, clientY, readBlockOptions(target));
    bindDocumentPointerMove();
    if (!options.skipFeedback) {
      feedback.emit({ sound: "hoverCard", source: "case.hover" });
    }
    return;
  }

  isActive = true;
  activeTarget = target;
  target.classList.add("is-case-title-active");

  block.activate(clientX, clientY, readBlockOptions(target));
  if (!options.skipFeedback) {
    feedback.emit({ sound: "hoverCard", source: "case.hover" });
  }

  bindDocumentPointerMove();
}

export function moveCaseFocusPointer(clientX: number, clientY: number) {
  if (!isActive) return;
  getCurrentlyBlock().movePointer(clientX, clientY);
}

export function deactivateCaseFocus() {
  if (!isActive) return;

  isActive = false;
  unbindDocumentPointerMove();
  activeTarget?.classList.remove("is-case-title-active");
  activeTarget = null;

  getCurrentlyBlock().deactivate();
}

export function resetCaseFocus() {
  deactivateCaseFocus();
  resetCurrentlyBlock();
}

export function isCaseFocusActive() {
  return isActive;
}

export function getActiveCaseFocusTarget() {
  return activeTarget;
}
