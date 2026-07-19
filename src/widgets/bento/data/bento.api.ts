import type { Locale } from "../../../i18n";
import {
  getMockBentoData,
  METRIC_SOURCES,
  withTileTooltip,
} from "./bento.mock";
import type { BentoData } from "./bento.types";
import { fetchTelegramCompactCount } from "./telegramSubscribers";
import { fetchYouTubeCompactCount } from "./youtubeSubscribers";

export async function getApiBentoData(locale?: Locale): Promise<BentoData> {
  const data = getMockBentoData(locale);
  let tiles = data.tiles;

  const [blog, ies, youtube] = await Promise.allSettled([
    fetchTelegramCompactCount(METRIC_SOURCES.mychannel),
    fetchTelegramCompactCount(METRIC_SOURCES.ies),
    fetchYouTubeCompactCount(METRIC_SOURCES.youtube),
  ]);

  if (blog.status === "fulfilled") {
    tiles = withTileTooltip(tiles, "mychannel", blog.value, locale);
  } else {
    console.warn(
      "[bento-widget] Telegram blog metric failed, using mock:",
      blog.reason,
    );
  }

  if (ies.status === "fulfilled") {
    tiles = withTileTooltip(tiles, "ies", ies.value, locale);
  } else {
    console.warn(
      "[bento-widget] Telegram IES metric failed, using mock:",
      ies.reason,
    );
  }

  if (youtube.status === "fulfilled") {
    tiles = withTileTooltip(tiles, "youtube", youtube.value, locale);
  } else {
    console.warn(
      "[bento-widget] YouTube metric failed, using mock:",
      youtube.reason,
    );
  }

  return { tiles };
}
