import { createDataSource } from "../../_shared/createDataSource";
import { env } from "../../../config/env.config";
import { getMockPhotoGallery } from "./photo.mock";
import { getApiPhotoGallery } from "./photo.api";

export const getPhotoGallery = createDataSource({
  mode: env.photo.mode,
  mock: getMockPhotoGallery,
  api: getApiPhotoGallery,
});
