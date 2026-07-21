import { feedback } from "../../experience/feedback/FeedbackBus";
import type { SoundId } from "../../experience/feedback/sounds.config";
import { userPreferences } from "../../experience/preferences/UserPreferences";
import { initHotkeys } from "../../experience/hotkeys/HotkeysManager";
import {
  bindContactPanel,
  bindContactPanelPersistence,
  prepareContactPanelForNavigation,
} from "./contact/ContactPanelController.client";
import {
  bindProfileMenu,
  syncProfileMenuOnLoad,
} from "./profile-menu/profile-menu.client";
import {
  bindCaseTransition,
  resetCaseTransition,
  syncCaseTransitionOnLoad,
} from "./case-transition/CaseTransitionController.client";
import { bindPageEnter, syncPageEnterOnLoad } from "./page-enter/PageEnterController.client";
import { initCaseHover, resetCaseHover } from "./case-hover/CaseHoverController.client";
import { initSayHiParticles, resetSayHiParticles } from "./say-hi/sayHiParticles.client";
import { resetEmployerName, initEmployerName } from "../../components/ui/employerName.client";
import { initContactButton, resetContactButton } from "../../components/ui/contactButton.client";
import { initCaseChrome } from "../cases/caseChrome.client";

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
  if (parsed.size > 0) return parsed;
  // bubble / paper — hover-only sounds, no default tap on click
  const hoverOnlySound = types.some((type) => type === "paper" || type === "bubble");
  return hoverOnlySound ? new Set() : new Set(["tap"]);
}

function findHoverFeedbackTarget(from: HTMLElement): { el: HTMLElement; sound: SoundId } | null {
  if (from.closest("[data-feedback-hover='off']")) return null;
  const target = from.closest<HTMLElement>("[data-feedback]");
  if (!target) return null;

  const types = (target.dataset.feedback ?? "").split(/\s+/).filter(Boolean);
  if (types.includes("paper")) return { el: target, sound: "paper" };
  if (types.includes("bubble")) return { el: target, sound: "bubble" };
  if (types.includes("hover")) return { el: target, sound: "hover" };
  return null;
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
    const hit = findHoverFeedbackTarget(e.target);
    if (!hit) return;

    const related = e.relatedTarget;
    if (related instanceof Node && hit.el.contains(related)) return;

    feedback.emit({
      sound: hit.sound,
      source: hit.el.dataset.feedbackSource ?? hit.el.tagName,
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
  initCaseChrome();

  if (document.body.dataset.page === "home") {
    initCaseHover();
    void initSayHiParticles();
  }

  if (document.querySelector("[data-profile-menu]")) {
    syncProfileMenuOnLoad();
    bindProfileMenu();
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
    initContactButton();
  }
}

document.addEventListener("astro:page-load", () => {
  resetContactButton();
  initExperience();
  syncCaseTransitionOnLoad();
  syncPageEnterOnLoad();
});

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  resetContactButton();
  resetEmployerName();
  initExperience();
});

type AstroTransitionEvent = Event & { to?: URL };

document.addEventListener("astro:before-preparation", (event) => {
  const transitionEvent = event as AstroTransitionEvent;
  prepareContactPanelForNavigation(transitionEvent.to);
  resetCaseTransition();
  resetCaseHover();
  resetSayHiParticles();
  resetEmployerName();
  resetContactButton();
});
