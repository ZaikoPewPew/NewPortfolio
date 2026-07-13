import { feedback } from "../../experience/feedback/FeedbackBus";

export function initMeWidget(root: HTMLElement) {
  if (root.hasAttribute("data-bound")) return;
  root.setAttribute("data-bound", "true");

  const front = root.querySelector<HTMLElement>('[data-me-face="front"]');
  const back = root.querySelector<HTMLElement>('[data-me-face="back"]');
  if (!front || !back) return;

  const setFlipped = (flipped: boolean) => {
    root.dataset.meFlipped = String(flipped);
    front.setAttribute("aria-hidden", String(flipped));
    back.setAttribute("aria-hidden", String(!flipped));
    front.toggleAttribute("inert", flipped);
    back.toggleAttribute("inert", !flipped);
  };

  const toggle = () => {
    const next = root.dataset.meFlipped !== "true";
    setFlipped(next);
    feedback.emit({ sound: "flip", haptic: "light", source: "me.flip" });
  };

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-contact-button]")) return;
    toggle();
  });
}
