import { feedback } from "../../experience/feedback/FeedbackBus";
import { userPreferences } from "../../experience/preferences/UserPreferences";
import { initHotkeys } from "../../experience/hotkeys/HotkeysManager";
import { bindContactPanel, bindCaseContactNavigation, resetContactPanel } from "./contact/ContactPanelController.client";
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
  bindCaseContactNavigation();

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

  if (!isHome) {
    feedback.emit({ sound: "pageTransition", source: "navigation" });
  }
});

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  initExperience();
  resetEmployerName();
});

document.addEventListener("astro:before-preparation", () => {
  resetContactPanel();
  resetEmployerName();
});
