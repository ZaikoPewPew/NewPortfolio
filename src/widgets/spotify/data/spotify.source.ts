import { createDataSource } from "../../_shared/createDataSource";
import { env } from "../../../config/env.config";
import { getMockSpotifyPlayback } from "./spotify.mock";
import { getApiSpotifyPlayback } from "./spotify.api";

export const getSpotifyPlayback = createDataSource({
  mode: env.spotify.mode,
  mock: getMockSpotifyPlayback,
  api: getApiSpotifyPlayback,
});
