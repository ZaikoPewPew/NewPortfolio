import books from "./books.json";
import type { BookEntry, BookReading } from "./book.types";

export function getMockBookReading(): BookReading {
  return {
    books: books as BookEntry[],
    currentIndex: 0,
  };
}
