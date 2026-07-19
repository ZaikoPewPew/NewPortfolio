import { formatCompactCount } from "./formatCompactCount";

/** Public Telegram channel/group preview — member count from t.me HTML. */

const TGME_EXTRA_RE =
  /<div class="tgme_page_extra">\s*([\d\s\u00a0\u202f]+)\s+(?:subscribers|members|подписчик|участник)/i;

export function parseTelegramMemberCount(html: string): number {
  const match = TGME_EXTRA_RE.exec(html);
  if (!match) {
    throw new Error("Telegram preview: member count not found");
  }

  const digits = match[1].replace(/[\s\u00a0\u202f]/g, "");
  const count = Number.parseInt(digits, 10);

  if (!Number.isFinite(count) || count < 0) {
    throw new Error(`Telegram preview: invalid member count "${match[1]}"`);
  }

  return count;
}

export async function fetchTelegramMemberCount(pageUrl: string): Promise<number> {
  const response = await fetch(pageUrl, {
    headers: {
      Accept: "text/html",
      "User-Agent": "Mozilla/5.0 (compatible; portfolio-build)",
    },
  });

  if (!response.ok) {
    throw new Error(`Telegram preview: ${response.status}`);
  }

  const html = await response.text();
  return parseTelegramMemberCount(html);
}

/** Fetch and format as compact tooltip metric (e.g. "1.1k"). */
export async function fetchTelegramCompactCount(
  pageUrl: string,
): Promise<string> {
  const count = await fetchTelegramMemberCount(pageUrl);
  return formatCompactCount(count);
}
