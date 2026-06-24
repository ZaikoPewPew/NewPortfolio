import type { PhotoData } from "./photo.types";
import { getMockPhoto } from "./photo.mock";

export async function getApiPhoto(): Promise<PhotoData> {
  return getMockPhoto();
}
