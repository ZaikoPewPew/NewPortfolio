export interface PhotoSlide {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  alt: string;
}

export interface PhotoGallery {
  slides: PhotoSlide[];
}
