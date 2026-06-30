export interface PhotoSlide {
  id: string;
  imageUrl: string;
  alt: string;
}

export interface PhotoGallery {
  slides: PhotoSlide[];
}
