import type { WidgetConfig } from "../_shared/types";

export const bookConfig: WidgetConfig = {
  id: "book",
  layout: "square",
  grid: { col: 1, row: 1 },
  status: "mock",
};

/** Маска штрихкода — цвет через --color-book-barcode */
export const bookAssets = {
  barcode: "/images/widgets/book/barcode.svg",
} as const;
