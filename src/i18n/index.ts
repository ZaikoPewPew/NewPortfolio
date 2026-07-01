import { defaultLocale, type Locale } from "./locale.config";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import type { Messages } from "./types";

const catalogs: Record<Locale, Messages> = { en, ru };

export function getMessages(locale: Locale = defaultLocale): Messages {
  return catalogs[locale];
}

export function interpolate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`
  );
}

export { defaultLocale, supportedLocales, type Locale } from "./locale.config";
export type { Messages, HotkeyMessageKey } from "./types";
