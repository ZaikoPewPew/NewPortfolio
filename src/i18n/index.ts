import { defaultLocale, isLocale, type Locale } from "./locale.config";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import type { Messages } from "./types";

const catalogs: Record<Locale, Messages> = { en, ru };

function readDocumentLocale(): Locale | undefined {
  if (typeof document === "undefined") return undefined;
  const lang = document.documentElement.lang;
  return isLocale(lang) ? lang : undefined;
}

/** Active catalog. Pass locale in Astro frontmatter; in the browser falls back to `<html lang>`. */
export function getMessages(locale?: Locale): Messages {
  const resolved = locale ?? readDocumentLocale() ?? defaultLocale;
  return catalogs[resolved];
}

export function interpolate(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`
  );
}

export {
  defaultLocale,
  getOtherLocale,
  isLocale,
  resolveLocale,
  supportedLocales,
  type Locale,
} from "./locale.config";
export type { Messages, HotkeyMessageKey } from "./types";
