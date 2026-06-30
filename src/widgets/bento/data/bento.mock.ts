import type { BentoData } from "./bento.types";

export function getMockBentoData(): BentoData {
  return {
    tiles: [
      {
        id: "mychannel",
        label: "My blog",
        href: "https://t.me/dsgn_thinking",
        variant: "mychannel",
        tooltip: ["my blog", "1.1k subs"],
      },
      {
        id: "ies",
        label: "IES",
        href: "https://t.me/howlhouse_bot",
        variant: "ies",
        tooltip: ["tg mini app", "1.8k users"],
      },
      {
        id: "youtube",
        label: "YouTube — Design Lead",
        href: "https://www.youtube.com/@DesignLeadd",
        variant: "youtube",
        caption: ["Design", "Lead"],
        tooltip: ["youtube", "22k subs"],
      },
    ],
  };
}
