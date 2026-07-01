export const supportedLocales = ["en", "ru"] as const;

export type Locale = (typeof supportedLocales)[number];

/** Активная локаль сайта. Для мультиязычности позже — роутинг или cookie. */
export const defaultLocale: Locale = "en";
