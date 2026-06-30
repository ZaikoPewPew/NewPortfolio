import type { PhotoGallery } from "./photo.types";

export function getMockPhotoGallery(): PhotoGallery {
  return {
    slides: [
      { id: "1", imageUrl: "/images/widgets/photo-1.svg", alt: "Фото 1" },
      { id: "2", imageUrl: "/images/widgets/photo-2.svg", alt: "Фото 2" },
      { id: "3", imageUrl: "/images/widgets/photo-3.svg", alt: "Фото 3" },
      { id: "4", imageUrl: "/images/widgets/photo-4.svg", alt: "Фото 4" },
      { id: "5", imageUrl: "/images/widgets/photo-5.svg", alt: "Фото 5" },
    ],
  };
}
