import type { MeProfile } from "./me.types";
import { siteConfig } from "../../../config/site.config";

export function getMockMeProfile(): MeProfile {
  return {
    name: siteConfig.name,
    role: siteConfig.role,
    bioLine1: siteConfig.bio.line1,
    bioLine2: siteConfig.bio.line2,
    avatarUrl: "/images/widgets/avatar.jpg",
  };
}
