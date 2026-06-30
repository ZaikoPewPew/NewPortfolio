import { feedback } from "../../experience/feedback/FeedbackBus";
import { userPreferences } from "../../experience/preferences/UserPreferences";
import { initHotkeys } from "../../experience/hotkeys/HotkeysManager";
import {
  initCaseHover,
  resetCaseHover,
  hideCasePreview,
} from "./case-hover/CaseHoverController.client";
import { bindContactPanel } from "./contact/ContactPanelController.client";

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

function initExperience(scope: "global" | "home") {
  userPreferences.init();
  bindFeedback();

  if (!hotkeysBound) {
    hotkeysBound = true;
    initHotkeys(scope);
  }

  if (scope === "home") {
    resetCaseHover();
    initCaseHover();
    bindContactPanel();
  }
}

document.addEventListener("astro:page-load", () => {
  const isHome = document.body.dataset.page === "home";
  initExperience(isHome ? "home" : "global");

  if (!isHome) {
    feedback.emit({ sound: "pageTransition", source: "navigation" });
  }
});

document.addEventListener("astro:before-preparation", () => {
  document.documentElement.classList.remove("is-case-active");
  hideCasePreview();
});
