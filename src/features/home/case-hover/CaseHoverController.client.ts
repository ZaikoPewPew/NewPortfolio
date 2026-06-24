import { feedback } from "../../../experience/feedback/FeedbackBus";
import { isMobileViewport, prefersReducedMotion } from "../../../experience/motion/prefersReducedMotion";

interface HoverData {
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: string;
  previewImage: string;
  title: string;
}

let hoverBound = false;

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

export function initCaseHover() {
  if (hoverBound) return;
  const page = document.querySelector<HTMLElement>("[data-home-page]");
  if (!page) return;

  hoverBound = true;
  const reducedMotion = prefersReducedMotion();
  const mobile = isMobileViewport();
  let activeCard: HTMLElement | null = null;

  const activate = (card: HTMLElement) => {
    if (mobile || reducedMotion) return;

    activeCard = card;
    const data = readHoverData(card);
    document.documentElement.classList.add("is-case-active");
    page.classList.add("is-case-active");
    card.classList.add("is-active");
    setGradient(data.gradientFrom, data.gradientTo, data.gradientAngle);
    showPanel(data);
    feedback.emit({ sound: "hoverSoft", source: "case.hover" });
  };

  const deactivate = () => {
    if (!activeCard) return;
    activeCard.classList.remove("is-active");
    activeCard = null;
    document.documentElement.classList.remove("is-case-active");
    page.classList.remove("is-case-active");
    setGradient("", "", "135");
    hideCasePreview();
  };

  page.addEventListener("mouseover", (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>("[data-case-card]");
    if (!card || card === activeCard) return;
    deactivate();
    activate(card);
  });

  page.addEventListener("mouseleave", () => {
    deactivate();
  });
}

export function resetCaseHover() {
  hoverBound = false;
  document.documentElement.classList.remove("is-case-active");
  hideCasePreview();
}
