import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { PhotoGallery } from "./photo.types";

const GALLERY_PUBLIC_DIR = join(
  process.cwd(),
  "public/images/widgets/photo-gallery",
);
const GALLERY_URL_PREFIX = "/images/widgets/photo-gallery";
const IMAGE_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;

const ALT_BY_FILE: Record<string, string> = {
  "1.jpg": "На лодке",
  "2.jpg": "В ресторане",
  "3.jpg": "На пляже",
  "4.jpg": "Зимой",
  "5.jpg": "Кот",
};

function getGalleryImageFiles(): string[] {
  return readdirSync(GALLERY_PUBLIC_DIR)
    .filter((file: string) => IMAGE_PATTERN.test(file))
    .sort((a: string, b: string) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
}

export function getMockPhotoGallery(): PhotoGallery {
  const files = getGalleryImageFiles();

  return {
    slides: files.map((file, index) => ({
      id: String(index + 1),
      imageUrl: `${GALLERY_URL_PREFIX}/${file}`,
      alt: ALT_BY_FILE[file] ?? `Фото ${index + 1}`,
    })),
  };
}
