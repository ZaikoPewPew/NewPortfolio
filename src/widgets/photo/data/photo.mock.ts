import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { PhotoGallery } from "./photo.types";
import { withBase } from "../../../lib/withBase";

const GALLERY_PUBLIC_DIR = join(
  process.cwd(),
  "public/images/widgets/photo-gallery",
);
const GALLERY_URL_PREFIX = withBase("/images/widgets/photo-gallery");
const MEDIA_PATTERN = /\.(avif|gif|jpe?g|png|webm|mp4|mov|m4v|webp)$/i;

const ALT_BY_FILE: Record<string, string> = {
  "1.jpg": "На лодке",
  "2.jpg": "В ресторане",
  "3.jpg": "На пляже",
  "4.jpg": "Зимой",
  "5.jpg": "Кот",
};

function getGalleryImageFiles(): string[] {
  return readdirSync(GALLERY_PUBLIC_DIR)
    .filter((file: string) => MEDIA_PATTERN.test(file))
    .sort((a: string, b: string) => {
      const nameA = a.replace(/\.[^.]+$/, "");
      const nameB = b.replace(/\.[^.]+$/, "");
      return nameA.localeCompare(nameB, undefined, { numeric: true });
    });
}

function getMediaType(fileName: string): "image" | "video" {
  return /\.(webm|mp4|mov|m4v)$/i.test(fileName) ? "video" : "image";
}

export function getMockPhotoGallery(): PhotoGallery {
  const files = getGalleryImageFiles();

  return {
    slides: files.map((file, index) => ({
      id: String(index + 1),
      mediaUrl: `${GALLERY_URL_PREFIX}/${file}`,
      mediaType: getMediaType(file),
      alt: ALT_BY_FILE[file] ?? `Фото ${index + 1}`,
    })),
  };
}
