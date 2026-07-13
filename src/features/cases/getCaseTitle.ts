import { getMessages, type Locale } from "../../i18n";

export function getCaseTitle(slug: string, locale?: Locale): string {
  const titles = getMessages(locale).cases.titles;
  return titles[slug as keyof typeof titles] ?? slug;
}
