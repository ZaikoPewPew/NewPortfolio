import { createDataSource } from "../../_shared/createDataSource";
import { env } from "../../../config/env.config";
import { getMockBentoData } from "./bento.mock";
import { getApiBentoData } from "./bento.api";

export const getBentoData = createDataSource({
  mode: env.bento.mode,
  mock: getMockBentoData,
  api: getApiBentoData,
});
