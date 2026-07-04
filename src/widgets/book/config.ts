import type { WidgetConfig } from "../_shared/types";

export const bookConfig: WidgetConfig = {
  id: "book",
  layout: "square",
  grid: { col: 1, row: 1 },
  status: "mock",
};

export const bookAssets = {
  barcode: "/images/widgets/book/barcode.png",
} as const;
