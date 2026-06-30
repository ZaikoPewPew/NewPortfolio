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
        tooltip: ["telegram", "1.1k subs"],
      },
      {
        id: "ies",
        label: "IES",
        href: "https://www.behance.net/",
        variant: "ies",
        tooltip: ["tg mini app", "1.8k users"],
      },
      {
        id: "youtube",
        label: "YouTube — Design Lead",
        href: "https://www.youtube.com/",
        variant: "youtube",
        caption: ["Design", "Lead"],
        tooltip: ["youtube", "22k subs"],
      },
    ],
  };
}
