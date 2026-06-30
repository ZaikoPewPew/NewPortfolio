import { siteConfig } from "../../../config/site.config";
import type { BentoData } from "./bento.types";

export function getMockBentoData(): BentoData {
  return {
    tiles: [
      {
        id: "mychannel",
        label: "Telegram-канал",
        href: siteConfig.social.telegram,
        variant: "mychannel",
      },
      {
        id: "ies",
        label: "IES",
        href: "https://www.behance.net/",
        variant: "ies",
      },
      {
        id: "youtube",
        label: "YouTube — Design Lead",
        href: "https://www.youtube.com/",
        variant: "youtube",
        caption: ["Design", "Lead"],
      },
    ],
  };
}
