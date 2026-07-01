import type { MeProfile } from "./me.types";
import { siteConfig } from "../../../config/site.config";
import { getMessages } from "../../../i18n";

export function getMockMeProfile(): MeProfile {
  const m = getMessages();

  return {
    name: siteConfig.name,
    role: m.me.role,
    bioLine1: m.me.bio.line1,
    bioLine2: m.me.bio.line2,
    avatarUrl: "/images/widgets/avatar.jpg",
  };
}
