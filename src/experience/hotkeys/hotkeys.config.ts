export type HotkeyScope = "global" | "home";

export type HotkeyAction =
  | "toggleSound"
  | "toggleTheme"
  | "focusCases"
  | "showShortcutsHelp"
  | "contactMe";

export interface HotkeyBinding {
  key: string;
  action: HotkeyAction;
  scope: HotkeyScope;
  description: string;
}

export const hotkeyBindings: HotkeyBinding[] = [
  { key: "m", action: "toggleSound", scope: "global", description: "Вкл/выкл звук" },
  { key: "t", action: "toggleTheme", scope: "global", description: "Сменить тему" },
  { key: "k", action: "focusCases", scope: "home", description: "Фокус на кейсы" },
  { key: "c", action: "contactMe", scope: "home", description: "Связаться" },
  { key: "a", action: "contactMe", scope: "home", description: "About" },
  { key: "?", action: "showShortcutsHelp", scope: "global", description: "Показать хоткеи" },
];
