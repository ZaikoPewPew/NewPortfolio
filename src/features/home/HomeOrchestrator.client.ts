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
import { resetEmployerName, initEmployerName } from "../../components/ui/employerName.client";

let feedbackBound = false;
let hotkeysBound = false;

function bindFeedback() {
  if (feedbackBound) return;
  feedbackBound = true;

  document.addEventListener(
    "click",
    () => feedback.unlock(),
    { once: true, passive: true }
  );

  document.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-feedback]");
    if (!target) return;
    const type = target.dataset.feedback ?? "tap";
    feedback.emit({
      sound: type === "hoverSoft" ? "hoverSoft" : "tap",
      haptic: "light",
      source: target.tagName,
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
  const isHome = document.body.dataset.page === "home";
  initExperience();
  syncCaseTransitionOnLoad();

  if (!isHome) {
    feedback.emit({ sound: "pageTransition", source: "navigation" });
  }
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
  resetEmployerName();
});
