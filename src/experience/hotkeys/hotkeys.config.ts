import type { HotkeyMessageKey } from "../../i18n/types";

export type HotkeyScope = "global" | "home";

export type HotkeyAction =
  | "toggleSound"
  | "toggleTheme"
  | "switchLanguage"
  | "focusCases"
  | "showShortcutsHelp"
  | "contactMe"
  | "goBackHome";

export interface HotkeyBinding {
  key: string;
  action: HotkeyAction;
  scope: HotkeyScope;
  messageKey: HotkeyMessageKey;
}

export const hotkeyBindings: HotkeyBinding[] = [
  { key: "s", action: "toggleSound", scope: "global", messageKey: "toggleSound" },
  { key: "t", action: "toggleTheme", scope: "global", messageKey: "toggleTheme" },
  { key: "l", action: "switchLanguage", scope: "global", messageKey: "switchLanguage" },
  { key: "k", action: "focusCases", scope: "home", messageKey: "focusCases" },
  { key: "h", action: "contactMe", scope: "home", messageKey: "contactMe" },
  { key: "c", action: "contactMe", scope: "home", messageKey: "contactAbout" },
  { key: "b", action: "goBackHome", scope: "home", messageKey: "backToHome" },
  { key: "?", action: "showShortcutsHelp", scope: "global", messageKey: "showShortcutsHelp" },
];
