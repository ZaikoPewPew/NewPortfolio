import { getMessages } from "../../i18n";

export function getCaseTitle(slug: string): string {
  const titles = getMessages().cases.titles;
  return titles[slug as keyof typeof titles] ?? slug;
}
