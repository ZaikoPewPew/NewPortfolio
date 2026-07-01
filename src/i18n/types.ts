import type en from "./locales/en.json";

export type Messages = typeof en;

export type HotkeyMessageKey = keyof Messages["hotkeys"];
