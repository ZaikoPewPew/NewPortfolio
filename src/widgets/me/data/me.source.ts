import { createDataSource } from "../../_shared/createDataSource";
import { env } from "../../../config/env.config";
import { getMockMeProfile } from "./me.mock";
import { getApiMeProfile } from "./me.api";

export const getMeProfile = createDataSource({
  mode: env.me.mode,
  mock: getMockMeProfile,
  api: getApiMeProfile,
});
