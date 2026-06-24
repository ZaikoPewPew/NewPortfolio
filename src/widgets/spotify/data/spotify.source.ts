import { createDataSource } from "../../_shared/createDataSource";
import { env } from "../../../config/env.config";
import { getMockTrack } from "./spotify.mock";
import { getApiTrack } from "./spotify.api";

export const getCurrentTrack = createDataSource({
  mode: env.spotify.mode,
  mock: getMockTrack,
  api: getApiTrack,
});
