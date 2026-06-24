import { createDataSource } from "../../_shared/createDataSource";
import { env } from "../../../config/env.config";
import { getMockIesStats } from "./ies.mock";
import { getApiIesStats } from "./ies.api";

export const getIesStats = createDataSource({
  mode: "mock",
  mock: getMockIesStats,
  api: getApiIesStats,
});

// IES uses static mock for now regardless of env
void env;
