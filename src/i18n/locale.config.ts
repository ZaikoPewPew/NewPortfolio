export const supportedLocales = ["en", "ru"] as const;

export type Locale = (typeof supportedLocales)[number];

/** Default locale (no URL prefix). */
export const defaultLocale: Locale = "en";

export function isLocale(value: string | undefined | null): value is Locale {
  return (
    typeof value === "string" &&
    (supportedLocales as readonly string[]).includes(value)
  );
}

/** Resolve Astro.currentLocale / document.lang to a supported Locale. */
export function resolveLocale(current?: string | undefined | null): Locale {
  return isLocale(current) ? current : defaultLocale;
}

export function getOtherLocale(locale: Locale): Locale {
  return locale === "en" ? "ru" : "en";
}
