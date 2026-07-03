import { defaultLocale } from "../../i18n/locale.config";

const localeTag = defaultLocale === "ru" ? "ru-RU" : "en-US";

export function formatContributionDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(localeTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
