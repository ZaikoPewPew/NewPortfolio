import { getMessages, type Locale } from "../../../i18n";
import type { BentoData } from "./bento.types";

const TILE_HREFS = {
  mychannel: "https://t.me/dsgn_thinking",
  ies: "https://t.me/howlhouse_bot",
  youtube: "https://www.youtube.com/@DesignLeadd",
} as const;

export function getMockBentoData(locale?: Locale): BentoData {
  const { bento } = getMessages(locale);

  return {
    tiles: [
      {
        id: "mychannel",
        label: bento.tiles.mychannel.label,
        href: TILE_HREFS.mychannel,
        variant: "mychannel",
        tooltip: [...bento.tiles.mychannel.tooltip],
        tooltipPlacement: "left",
      },
      {
        id: "ies",
        label: bento.tiles.ies.label,
        href: TILE_HREFS.ies,
        variant: "ies",
        tooltip: [...bento.tiles.ies.tooltip],
        tooltipPlacement: "right",
      },
      {
        id: "youtube",
        label: bento.tiles.youtube.label,
        href: TILE_HREFS.youtube,
        variant: "youtube",
        caption: [...bento.tiles.youtube.caption],
        tooltip: [...bento.tiles.youtube.tooltip],
        tooltipPlacement: "right",
      },
    ],
  };
}
