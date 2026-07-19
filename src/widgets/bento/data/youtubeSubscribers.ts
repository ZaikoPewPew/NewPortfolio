import {
  formatCompactCount,
  parseCompactCountLabel,
} from "./formatCompactCount";

/**
 * Channel header metric on youtube.com/@handle:
 * {"metadataParts":[{"text":{"content":"22.7K subscribers"},...
 */
const YT_CHANNEL_SUBS_RE =
  /"metadataParts":\[\{"text":\{"content":"([\d.,]+\s*[KkMm]?)\s*subscribers"/i;

export function parseYouTubeSubscriberCount(html: string): number {
  const match = YT_CHANNEL_SUBS_RE.exec(html);
  if (!match) {
    throw new Error("YouTube: subscriber count not found");
  }

  return parseCompactCountLabel(match[1].replace(/\s+/g, ""));
}

export async function fetchYouTubeSubscriberCount(
  channelUrl: string,
): Promise<number> {
  const response = await fetch(channelUrl, {
    headers: {
      Accept: "text/html",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "Mozilla/5.0 (compatible; portfolio-build)",
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube: ${response.status}`);
  }

  const html = await response.text();
  return parseYouTubeSubscriberCount(html);
}

export async function fetchYouTubeCompactCount(
  channelUrl: string,
): Promise<string> {
  const count = await fetchYouTubeSubscriberCount(channelUrl);
  return formatCompactCount(count);
}
