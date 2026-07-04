import { navigate } from "astro:transitions/client";
import { hotkeyBindings, type HotkeyAction } from "./hotkeys.config";
import { feedback } from "../feedback/FeedbackBus";
import { toggleThemeWithTransition } from "../preferences/themeTransition";
import { userPreferences } from "../preferences/UserPreferences";
import { getMessages } from "../../i18n";
import {
  isContactPanelOpen,
  toggleContactPanel,
} from "../../features/home/contact/ContactPanelController.client";
import { beginCaseTransitionBack } from "../../features/home/case-transition/CaseTransitionController.client";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function normalizeHotkey(event: KeyboardEvent): string | null {
  if (event.code === "KeyC") return "c";
  if (event.code === "KeyH") return "h";
  if (event.code === "KeyK") return "k";
  if (event.code === "KeyM") return "m";
  if (event.code === "KeyT") return "t";
  if (event.code === "KeyB") return "b";
  if (event.key === "?") return "?";
  return event.key.length === 1 ? event.key.toLowerCase() : null;
}

function runAction(action: HotkeyAction, key: string) {
  switch (action) {
    case "toggleSound": {
      const on = userPreferences.toggleSound();
      feedback.emit({ haptic: "light", source: "hotkey.sound" });
      console.info(`Sound ${on ? "on" : "off"}`);
      break;
    }
    case "toggleTheme": {
      const theme = toggleThemeWithTransition();
      feedback.emit({ sound: "tap", haptic: "light", source: "hotkey.theme" });
      console.info(`Theme: ${theme}`);
      break;
    }
    case "focusCases": {
      const first = document.querySelector<HTMLElement>("[data-case-card]");
      first?.focus();
      feedback.emit({ sound: "tap", source: "hotkey.focusCases" });
      break;
    }
    case "showShortcutsHelp": {
      const hotkeys = getMessages().hotkeys;
      const lines = hotkeyBindings.map((b) => `${b.key} — ${hotkeys[b.messageKey]}`);
      console.info("Hotkeys:\n" + lines.join("\n"));
      feedback.emit({ haptic: "light", source: "hotkey.help" });
      break;
    }
    case "contactMe": {
      const shouldToggle = key === "h" || (key === "c" && isContactPanelOpen());
      if (!shouldToggle) return;
      toggleContactPanel();
      break;
    }
    case "goBackHome": {
      if (document.body.dataset.page !== "case") return;
      feedback.emit({ sound: "tap", haptic: "light", source: "hotkey.backHome" });
      beginCaseTransitionBack();
      navigate("/");
      break;
    }
  }
}

export function initHotkeys(scope: "global" | "home" = "global") {
  document.addEventListener("keydown", (e) => {
    if (isTypingTarget(e.target)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const normalizedKey = normalizeHotkey(e);
    if (!normalizedKey) return;

    const binding = hotkeyBindings.find(
      (b) =>
        b.key === normalizedKey &&
        (b.scope === "global" || (b.scope === "home" && scope === "home"))
    );

    if (!binding) return;
    e.preventDefault();
    runAction(binding.action, normalizedKey);
  });
}
