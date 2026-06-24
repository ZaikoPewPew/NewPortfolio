import type { MeProfile } from "./me.types";
import { siteConfig } from "../../../config/site.config";

export function getMockMeProfile(): MeProfile {
  return {
    name: siteConfig.name,
    role: siteConfig.role,
    avatarUrl: "/images/widgets/avatar-placeholder.svg",
    instagramUrl: siteConfig.social.instagram,
  };
}
