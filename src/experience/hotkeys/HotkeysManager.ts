import { hotkeyBindings, type HotkeyAction } from "./hotkeys.config";
import { feedback } from "../feedback/FeedbackBus";
import { userPreferences } from "../preferences/UserPreferences";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function runAction(action: HotkeyAction) {
  switch (action) {
    case "toggleSound": {
      const on = userPreferences.toggleSound();
      feedback.emit({ haptic: "light", source: "hotkey.sound" });
      console.info(`Sound ${on ? "on" : "off"}`);
      break;
    }
    case "toggleTheme": {
      const theme = userPreferences.toggleTheme();
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
      const lines = hotkeyBindings.map((b) => `${b.key} — ${b.description}`);
      console.info("Hotkeys:\n" + lines.join("\n"));
      feedback.emit({ haptic: "light", source: "hotkey.help" });
      break;
    }
  }
}

export function initHotkeys(scope: "global" | "home" = "global") {
  document.addEventListener("keydown", (e) => {
    if (isTypingTarget(e.target)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const binding = hotkeyBindings.find(
      (b) =>
        b.key === e.key &&
        (b.scope === "global" || (b.scope === "home" && scope === "home"))
    );

    if (!binding) return;
    e.preventDefault();
    runAction(binding.action);
  });
}
