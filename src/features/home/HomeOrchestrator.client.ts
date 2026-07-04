import { feedback } from "../../experience/feedback/FeedbackBus";
import { userPreferences } from "../../experience/preferences/UserPreferences";
import { initHotkeys } from "../../experience/hotkeys/HotkeysManager";
import {
  bindContactPanel,
  bindContactPanelPersistence,
  prepareContactPanelForNavigation,
} from "./contact/ContactPanelController.client";
import {
  bindCaseTransition,
  resetCaseTransition,
  syncCaseTransitionOnLoad,
} from "./case-transition/CaseTransitionController.client";
import { bindPageEnter, syncPageEnterOnLoad } from "./page-enter/PageEnterController.client";
import { initCaseHover, resetCaseHover } from "./case-hover/CaseHoverController.client";
import { resetEmployerName, initEmployerName } from "../../components/ui/employerName.client";

let feedbackBound = false;
let hotkeysBound = false;

type FeedbackInteraction = "tap" | "hover";

function parseFeedbackTypes(raw: string | undefined): Set<FeedbackInteraction> {
  if (!raw) return new Set(["tap"]);
  const types = raw.split(/\s+/).filter(Boolean);
  const parsed = new Set<FeedbackInteraction>();
  for (const type of types) {
    if (type === "tap" || type === "hover") parsed.add(type);
  }
  return parsed.size > 0 ? parsed : new Set(["tap"]);
}

function findHoverFeedbackTarget(from: HTMLElement): HTMLElement | null {
  if (from.closest("[data-feedback-hover='off']")) return null;
  const target = from.closest<HTMLElement>("[data-feedback]");
  if (!target || !parseFeedbackTypes(target.dataset.feedback).has("hover")) return null;
  return target;
}

function bindFeedback() {
  if (feedbackBound) return;
  feedbackBound = true;

  const unlock = () => feedback.unlock();

  document.addEventListener("click", unlock, { once: true, passive: true });
  document.addEventListener("pointerdown", unlock, { once: true, passive: true });

  document.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-feedback]");
    if (!target || !parseFeedbackTypes(target.dataset.feedback).has("tap")) return;
    feedback.emit({
      sound: "tap",
      haptic: "light",
      source: target.dataset.feedbackSource ?? target.tagName,
    });
  });

  document.addEventListener("mouseover", (e) => {
    if (!(e.target instanceof HTMLElement)) return;
    const target = findHoverFeedbackTarget(e.target);
    if (!target) return;

    const related = e.relatedTarget;
    if (related instanceof Node && target.contains(related)) return;

    feedback.emit({
      sound: "hover",
      source: target.dataset.feedbackSource ?? target.tagName,
    });
  });
}

function hasWidgetsLayout() {
  return Boolean(document.querySelector("[data-contact-layout]"));
}

function initExperience() {
  userPreferences.init();
  bindFeedback();
  bindContactPanelPersistence();
  bindCaseTransition();
  bindPageEnter();

  if (document.body.dataset.page === "home") {
    initCaseHover();
  }

  if (!hotkeysBound) {
    hotkeysBound = true;
    const hotkeyScope =
      document.body.dataset.page === "home" || hasWidgetsLayout() ? "home" : "global";
    initHotkeys(hotkeyScope);
  }

  if (hasWidgetsLayout()) {
    bindContactPanel();
    initEmployerName();
  }
}

document.addEventListener("astro:page-load", () => {
  initExperience();
  syncCaseTransitionOnLoad();
  syncPageEnterOnLoad();
});

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  initExperience();
  resetEmployerName();
});

type AstroTransitionEvent = Event & { to?: URL };

document.addEventListener("astro:before-preparation", (event) => {
  const transitionEvent = event as AstroTransitionEvent;
  prepareContactPanelForNavigation(transitionEvent.to);
  resetCaseTransition();
  resetCaseHover();
  resetEmployerName();
});
