import { resolveLocale, type Locale } from "../../i18n/locale.config";

export function formatContributionDate(isoDate: string, locale?: Locale): string {
  const resolved = resolveLocale(locale);
  const localeTag = resolved === "ru" ? "ru-RU" : "en-US";
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(localeTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
