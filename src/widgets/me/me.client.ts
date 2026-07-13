import {
  resetContactButton,
  resumeContactButtonHover,
} from "../../components/ui/contactButton.client";
import { feedback } from "../../experience/feedback/FeedbackBus";
import { prefersReducedMotion } from "../../experience/motion/prefersReducedMotion";

function readMeFlipMs(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--motion-me-flip")
    .trim();
  if (raw.endsWith("ms")) return Number.parseFloat(raw) || 960;
  if (raw.endsWith("s")) return (Number.parseFloat(raw) || 0.96) * 1000;
  return 960;
}

function isShowingBack(rotationY: number): boolean {
  const turns = Math.round(rotationY / 180);
  return (((turns % 2) + 2) % 2) === 1;
}

export function initMeWidget(root: HTMLElement) {
  if (root.hasAttribute("data-bound")) return;
  root.setAttribute("data-bound", "true");

  const front = root.querySelector<HTMLElement>('[data-me-face="front"]');
  const back = root.querySelector<HTMLElement>('[data-me-face="back"]');
  const flipper = root.querySelector<HTMLElement>(".me-widget__flipper");
  if (!front || !back || !flipper) return;

  let rotationY = 0;
  let nextDir = 1;
  let flipGeneration = 0;
  let flippingTimer: number | undefined;

  const syncFaces = () => {
    const flipped = isShowingBack(rotationY);
    root.dataset.meFlipped = String(flipped);
    front.setAttribute("aria-hidden", String(flipped));
    back.setAttribute("aria-hidden", String(!flipped));
    front.toggleAttribute("inert", flipped);
    back.toggleAttribute("inert", !flipped);
  };

  const endFlipping = (generation: number) => {
    if (generation !== flipGeneration) return;
    if (flippingTimer !== undefined) {
      window.clearTimeout(flippingTimer);
      flippingTimer = undefined;
    }
    delete root.dataset.meFlipping;
    root.removeAttribute("data-feedback-hover");
    syncFaces();
    resumeContactButtonHover(root);
  };

  const beginFlipping = () => {
    resetContactButton(root);

    if (prefersReducedMotion()) {
      delete root.dataset.meFlipping;
      root.removeAttribute("data-feedback-hover");
      return;
    }

    // Keep both faces hittable mid-flip so say hi stays clickable;
    // backface-visibility decides which face receives the pointer.
    front.toggleAttribute("inert", false);
    back.toggleAttribute("inert", false);

    const generation = ++flipGeneration;
    root.dataset.meFlipping = "";
    root.setAttribute("data-feedback-hover", "off");

    if (flippingTimer !== undefined) window.clearTimeout(flippingTimer);
    flippingTimer = window.setTimeout(() => endFlipping(generation), readMeFlipMs() + 50);
  };

  flipper.addEventListener("transitionend", (event) => {
    if (event.target !== flipper || event.propertyName !== "transform") return;
    endFlipping(flipGeneration);
  });

  const flip = () => {
    rotationY += nextDir * 180;
    nextDir *= -1;

    beginFlipping();
    flipper.style.transform = `rotateY(${rotationY}deg)`;

    // Instant swap when motion is off; otherwise wait until flip settles
    // so the outgoing face (and its button) is not inert mid-animation.
    if (prefersReducedMotion()) syncFaces();

    feedback.emit({ sound: "flip", haptic: "light", source: "me.flip" });
  };

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-contact-button]")) return;
    flip();
  });
}
