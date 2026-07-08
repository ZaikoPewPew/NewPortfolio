import { isMobileViewport, prefersReducedMotion } from "../../../experience/motion/prefersReducedMotion";
import { getMessages } from "../../../i18n";

let cursorElement: HTMLElement | null = null;
let isActive = false;

function isDisabled() {
  return prefersReducedMotion() || isMobileViewport();
}

function getCaseCursor(): HTMLElement {
  if (cursorElement && document.body.contains(cursorElement)) {
    return cursorElement;
  }

  const cursor = document.createElement("div");
  cursor.className = "case-cursor";
  cursor.setAttribute("data-case-cursor", "");
  cursor.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "case-cursor__label";
  label.textContent = getMessages().cases.hoverCursor;
  cursor.append(label);

  document.body.append(cursor);
  cursorElement = cursor;
  return cursor;
}

function setPosition(clientX: number, clientY: number) {
  const cursor = getCaseCursor();
  cursor.style.setProperty("--case-cursor-x", `${clientX}px`);
  cursor.style.setProperty("--case-cursor-y", `${clientY}px`);
}

export function initCaseCursor() {
  if (isDisabled()) return;
  getCaseCursor();
}

export function activateCaseCursor(clientX: number, clientY: number) {
  if (isDisabled()) return;

  isActive = true;
  const cursor = getCaseCursor();
  setPosition(clientX, clientY);
  cursor.classList.add("is-active");
}

export function moveCaseCursor(clientX: number, clientY: number) {
  if (!isActive) return;
  setPosition(clientX, clientY);
}

export function deactivateCaseCursor() {
  if (!isActive) return;

  isActive = false;
  cursorElement?.classList.remove("is-active");
}

export function resetCaseCursor() {
  deactivateCaseCursor();
  cursorElement?.remove();
  cursorElement = null;
}
