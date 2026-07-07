export type ConceptMediaType = "image" | "video";

export interface ConceptMedia {
  type: ConceptMediaType;
  src: string;
  alt: string;
}

export interface ConceptItem {
  id: string;
  media: ConceptMedia;
  colSpan?: 1 | 2;
  rowSpan?: 1 | 2;
}
