import { prefersReducedMotion } from "../../experience/motion/prefersReducedMotion";

let visibilityBound = false;

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

function clearContactButtonHover(button: HTMLButtonElement) {
  button.removeAttribute("data-contact-hover");

  const fill = button.querySelector<HTMLElement>(".contact-button__fill");
  fill?.style.removeProperty("clip-path");
}

function bindContactButton(button: HTMLButtonElement) {
  const fill = button.querySelector<HTMLElement>(".contact-button__fill");
  if (!fill) return;

  if (button.hasAttribute("data-contact-button-bound")) {
    requestAnimationFrame(() => {
      if (button.matches(":hover")) return;

      clearContactButtonHover(button);

      if (document.activeElement === button) {
        button.blur();
      }
    });
    return;
  }

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

  requestAnimationFrame(() => {
    if (button.matches(":hover")) return;

    clearContactButtonHover(button);

    if (document.activeElement === button) {
      button.blur();
    }
  });
}

function bindVisibilityReset() {
  if (visibilityBound) return;
  visibilityBound = true;

  // Cmd+Tab / app switch: mouseleave often does not fire, hover fill sticks.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return;
    resetContactButton();
  });
}

export function initContactButton(root: ParentNode = document) {
  bindVisibilityReset();
  root.querySelectorAll<HTMLButtonElement>("[data-contact-button]").forEach(bindContactButton);
}

export function resetContactButton(root: ParentNode = document) {
  root.querySelectorAll<HTMLButtonElement>("[data-contact-button]").forEach((button) => {
    clearContactButtonHover(button);

    if (document.activeElement === button) {
      button.blur();
    }
  });
}
