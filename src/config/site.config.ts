import { withBase } from "../lib/withBase";

export const siteConfig = {
  name: "Vladislav Kurguzov",
  employer: {
    label: "alfa-bank",
    url: "https://alfabank.ru/",
    video: withBase("/images/widgets/currently-block/fantech.mp4"),
  },
  location: {
    city: "Almaty",
    cityCode: "ala",
    timezone: "Asia/Almaty",
  },
  social: {
    github: "https://github.com/ZaikoPewPew",
    instagram: "https://instagram.com/",
    email: "kvneasyy@gmail.com",
    linkedin: "https://www.linkedin.com/in/kvneasy/",
    telegram: "https://t.me/ezzzz12345",
    x: "https://x.com/kvneasy",
    cv: "",
  },
} as const;
