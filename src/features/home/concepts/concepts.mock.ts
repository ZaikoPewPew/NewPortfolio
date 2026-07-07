import type { ConceptItem } from "./concept.types";

/** Placeholder-концепты для витрины на главной. Позже заменим на реальный контент. */
export const conceptItems: ConceptItem[] = [
  {
    id: "concept-a",
    media: {
      type: "image",
      src: "/images/widgets/photo-gallery/5.jpg",
      alt: "Concept preview",
    },
    colSpan: 1,
    rowSpan: 2,
  },
  {
    id: "concept-b",
    media: {
      type: "image",
      src: "/images/widgets/photo-gallery/3.jpg",
      alt: "Concept preview",
    },
    colSpan: 1,
    rowSpan: 1,
  },
  {
    id: "concept-c",
    media: {
      type: "video",
      src: "/images/widgets/photo-gallery/1.MP4",
      alt: "Concept motion preview",
    },
    colSpan: 1,
    rowSpan: 1,
  },
];
