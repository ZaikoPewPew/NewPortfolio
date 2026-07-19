import { createDataSource } from "../../_shared/createDataSource";
import { env } from "../../../config/env.config";
import type { Locale } from "../../../i18n";
import { getMockBentoData } from "./bento.mock";
import { getApiBentoData } from "./bento.api";
import type { BentoData } from "./bento.types";

export function getBentoData(locale?: Locale): Promise<BentoData> {
  return createDataSource({
    mode: env.bento.mode,
    mock: () => getMockBentoData(locale),
    api: () => getApiBentoData(locale),
  })();
}
