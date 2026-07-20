import { getMessages, interpolate, type Locale } from "../../../i18n";
import type { BentoData, BentoTile } from "./bento.types";

export const TILE_HREFS = {
  mychannel: "https://t.me/dsgn_thinking",
  ies: "https://t.me/howlhouse_bot",
  youtube: "https://www.youtube.com/@DesignLeadd",
} as const;

/** Public pages used only for build-time metric scraping (may differ from tile href). */
export const METRIC_SOURCES = {
  mychannel: "https://t.me/dsgn_thinking",
  ies: "https://t.me/ies_app",
  youtube: "https://www.youtube.com/@DesignLeadd",
} as const;

type MetricTileId = keyof typeof METRIC_SOURCES;

function tooltipForTile(
  id: MetricTileId,
  countLabel: string | "fallback",
  locale?: Locale,
): [string, string] {
  const tile = getMessages(locale).bento.tiles[id];
  const metric =
    countLabel === "fallback"
      ? tile.tooltipMetricFallback
      : interpolate(tile.tooltipMetric, { count: countLabel });
  return [tile.tooltipTitle, metric];
}

export function getMockBentoData(locale?: Locale): BentoData {
  const { bento } = getMessages(locale);

  return {
    tiles: [
      {
        id: "mychannel",
        label: bento.tiles.mychannel.label,
        href: TILE_HREFS.mychannel,
        variant: "mychannel",
        tooltip: tooltipForTile("mychannel", "fallback", locale),
        tooltipPlacement: "bottom",
      },
      {
        id: "ies",
        label: bento.tiles.ies.label,
        href: TILE_HREFS.ies,
        variant: "ies",
        tooltip: tooltipForTile("ies", "fallback", locale),
        tooltipPlacement: "bottom",
      },
      {
        id: "youtube",
        label: bento.tiles.youtube.label,
        href: TILE_HREFS.youtube,
        variant: "youtube",
        caption: [...bento.tiles.youtube.caption],
        tooltip: tooltipForTile("youtube", "fallback", locale),
        tooltipPlacement: "bottom",
      },
    ],
  };
}

export function tileTooltipWithCount(
  id: MetricTileId,
  countLabel: string,
  locale?: Locale,
): [string, string] {
  return tooltipForTile(id, countLabel, locale);
}

export function withTileTooltip(
  tiles: BentoTile[],
  id: MetricTileId,
  countLabel: string,
  locale?: Locale,
): BentoTile[] {
  const tooltip = tileTooltipWithCount(id, countLabel, locale);
  return tiles.map((tile) => (tile.id === id ? { ...tile, tooltip } : tile));
}
