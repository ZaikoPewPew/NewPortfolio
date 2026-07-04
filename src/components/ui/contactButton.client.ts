import { prefersReducedMotion } from "../../experience/motion/prefersReducedMotion";

function getRelativePoint(clientX: number, clientY: number, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100,
  };
}

function readFillRadiusHover(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--contact-button-fill-radius-hover")
    .trim();
  return raw || "150%";
}

function setFillClipPath(fill: HTMLElement, radius: string, x: number, y: number) {
  fill.style.clipPath = `circle(${radius} at ${x}% ${y}%)`;
}

function bindContactButton(button: HTMLButtonElement) {
  if (button.hasAttribute("data-contact-button-bound")) return;

  const fill = button.querySelector<HTMLElement>(".contact-button__fill");
  if (!fill) return;

  button.setAttribute("data-contact-button-bound", "true");

  const reducedMotion = prefersReducedMotion();
  const fillRadiusHover = readFillRadiusHover();

  const setHoverActive = (active: boolean) => {
    if (active) button.setAttribute("data-contact-hover", "");
    else button.removeAttribute("data-contact-hover");
  };

  const fillIn = (x: number, y: number) => {
    setHoverActive(true);
    if (reducedMotion) return;

    setFillClipPath(fill, "0%", x, y);
    requestAnimationFrame(() => {
      setFillClipPath(fill, fillRadiusHover, x, y);
    });
  };

  const fillOut = (x: number, y: number) => {
    setHoverActive(false);
    if (reducedMotion) return;

    setFillClipPath(fill, "0%", x, y);
  };

  button.addEventListener("mouseenter", (event) => {
    const { x, y } = getRelativePoint(event.clientX, event.clientY, button);
    fillIn(x, y);
  });

  button.addEventListener("mouseleave", (event) => {
    if (button.matches(":focus-visible")) return;

    const { x, y } = getRelativePoint(event.clientX, event.clientY, button);
    fillOut(x, y);
  });

  button.addEventListener("focusin", () => {
    if (button.hasAttribute("data-contact-hover")) return;
    fillIn(50, 50);
  });

  button.addEventListener("focusout", (event) => {
    if (button.contains(event.relatedTarget as Node | null)) return;
    if (button.matches(":hover")) return;
    fillOut(50, 50);
  });
}

export function initContactButton(root: ParentNode = document) {
  root.querySelectorAll<HTMLButtonElement>("[data-contact-button]").forEach(bindContactButton);
}

export function resetContactButton(root: ParentNode = document) {
  root.querySelectorAll<HTMLButtonElement>("[data-contact-button]").forEach((button) => {
    button.removeAttribute("data-contact-button-bound");
    button.removeAttribute("data-contact-hover");

    const fill = button.querySelector<HTMLElement>(".contact-button__fill");
    fill?.style.removeProperty("clip-path");
  });
}
