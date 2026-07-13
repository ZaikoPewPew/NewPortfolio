import type { MeProfile } from "./me.types";
import { getMessages, type Locale } from "../../../i18n";

export function getMockMeProfile(locale?: Locale): MeProfile {
  const m = getMessages(locale);

  return {
    name: m.me.name,
    role: m.me.role,
    bioLine1: m.me.bio.line1,
    bioLine2: m.me.bio.line2,
    avatarUrl: "/images/widgets/avatar.jpg",
  };
}
