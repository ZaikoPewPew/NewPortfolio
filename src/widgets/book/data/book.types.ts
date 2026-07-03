export interface BookEntry {
  title: string;
  author: string;
}

export interface BookReading {
  books: BookEntry[];
  currentIndex: number;
}
