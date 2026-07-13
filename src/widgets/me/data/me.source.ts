import { createDataSource } from "../../_shared/createDataSource";
import { env } from "../../../config/env.config";
import type { Locale } from "../../../i18n";
import { getMockMeProfile } from "./me.mock";
import { getApiMeProfile } from "./me.api";
import type { MeProfile } from "./me.types";

export function getMeProfile(locale?: Locale): Promise<MeProfile> {
  return createDataSource({
    mode: env.me.mode,
    mock: () => getMockMeProfile(locale),
    api: () => getApiMeProfile(),
  })();
}
