import type { PhotoData } from "./photo.types";

export function getMockPhoto(): PhotoData {
  return {
    imageUrl: "/images/widgets/photo-placeholder.svg",
    alt: "Детское фото",
  };
}
