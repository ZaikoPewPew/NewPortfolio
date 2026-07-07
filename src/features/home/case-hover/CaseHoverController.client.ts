import { isMobileViewport, prefersReducedMotion } from "../../../experience/motion/prefersReducedMotion";
import {
  activateCaseFocus,
  deactivateCaseFocus,
  initCaseFocus,
  resetCaseFocus,
} from "./caseFocus.client";

interface HoverData {
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: string;
  previewImage: string;
  title: string;
}

let boundPage: HTMLElement | null = null;
let boundCasesRegion: HTMLElement | null = null;
let activeHoverCard: HTMLAnchorElement | null = null;

function onDocumentPointerMove(e: PointerEvent) {
  const activeCard = activeHoverCard;
  if (!activeCard) return;

  const rect = activeCard.getBoundingClientRect();
  const inside =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  if (inside) return;

  deactivateCaseHover();
}

function readHoverData(el: HTMLElement): HoverData {
  return {
    gradientFrom: el.dataset.hoverFrom ?? "",
    gradientTo: el.dataset.hoverTo ?? "",
    gradientAngle: el.dataset.hoverAngle ?? "135",
    previewImage: el.dataset.hoverPreview ?? "",
    title: el.dataset.hoverTitle ?? "",
  };
}

function setGradient(from: string, to: string, angle: string) {
  const root = document.documentElement;
  if (!from || !to) {
    root.style.removeProperty("--page-gradient");
    return;
  }
  root.style.setProperty(
    "--page-gradient",
    `linear-gradient(${angle}deg, ${from}, ${to})`
  );
}

function getPanel(): HTMLElement | null {
  return document.getElementById("case-preview-panel");
}

function showPanel(data: HoverData) {
  const panel = getPanel();
  if (!panel) return;

  const img = panel.querySelector<HTMLImageElement>("[data-preview-image]");
  const title = panel.querySelector<HTMLElement>("[data-preview-title]");

  if (img && data.previewImage) {
    img.src = data.previewImage;
    img.hidden = false;
  } else if (img) {
    img.hidden = true;
  }

  if (title) title.textContent = data.title;
  panel.classList.add("is-visible");
}

export function hideCasePreview() {
  getPanel()?.classList.remove("is-visible");
}

export function deactivateCaseHover() {
  const activeCard = activeHoverCard;

  if (activeCard) {
    activeCard.classList.remove("is-active");
  }

  activeHoverCard = null;
  deactivateCaseFocus();
  const page = document.querySelector<HTMLElement>("[data-home-page]");
  document.documentElement.classList.remove("is-case-active");
  page?.classList.remove("is-case-active");
  document.documentElement.style.removeProperty("--page-gradient");
  hideCasePreview();
}

function resolveCard(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof HTMLElement)) return null;
  return target.closest<HTMLAnchorElement>("[data-case-card]");
}

export function initCaseHover() {
  const page = document.querySelector<HTMLElement>("[data-home-page]");
  if (!page || boundPage === page) return;

  boundPage = page;
  boundCasesRegion = page.querySelector<HTMLElement>(".home__cases");
  initCaseFocus();

  const reducedMotion = prefersReducedMotion();
  const mobile = isMobileViewport();
  const casesRegion = boundCasesRegion;
  if (!casesRegion) return;

  const activate = (card: HTMLAnchorElement, clientX: number, clientY: number) => {
    if (mobile || reducedMotion) return;

    activeHoverCard = card;
    const data = readHoverData(card);
    document.documentElement.classList.add("is-case-active");
    page.classList.add("is-case-active");
    card.classList.add("is-active");
    setGradient(data.gradientFrom, data.gradientTo, data.gradientAngle);
    showPanel(data);
    activateCaseFocus(card, clientX, clientY);
  };

  document.removeEventListener("pointermove", onDocumentPointerMove);
  document.addEventListener("pointermove", onDocumentPointerMove, { passive: true });

  casesRegion.addEventListener("pointerover", (e) => {
    if (mobile || reducedMotion) return;

    const card = resolveCard(e.target);
    if (!card || card === activeHoverCard) return;

    deactivateCaseHover();
    activate(card, e.clientX, e.clientY);
  });

  page.addEventListener("pointerleave", (e) => {
    if (mobile || reducedMotion || !activeHoverCard) return;

    const related = e.relatedTarget;
    if (related instanceof Node && activeHoverCard.contains(related)) return;
    deactivateCaseHover();
  });
}

export function resetCaseHover() {
  document.removeEventListener("pointermove", onDocumentPointerMove);
  boundPage = null;
  boundCasesRegion = null;
  activeHoverCard = null;
  resetCaseFocus();
  document.documentElement.classList.remove("is-case-active");
  hideCasePreview();
}
