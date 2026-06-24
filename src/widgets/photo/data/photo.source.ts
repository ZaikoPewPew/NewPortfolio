import { createDataSource } from "../../_shared/createDataSource";
import { getMockPhoto } from "./photo.mock";
import { getApiPhoto } from "./photo.api";

export const getPhoto = createDataSource({
  mode: "mock",
  mock: getMockPhoto,
  api: getApiPhoto,
});
