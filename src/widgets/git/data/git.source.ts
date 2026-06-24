import { createDataSource } from "../../_shared/createDataSource";
import { env } from "../../../config/env.config";
import { getMockGitProfile } from "./git.mock";
import { getApiGitProfile } from "./git.api";

export const getGitProfile = createDataSource({
  mode: env.github.mode,
  mock: getMockGitProfile,
  api: getApiGitProfile,
});
