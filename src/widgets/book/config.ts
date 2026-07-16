import type { WidgetConfig } from "../_shared/types";
import { withBase } from "../../lib/withBase";

export const bookConfig: WidgetConfig = {
  id: "book",
  layout: "square",
  grid: { col: 1, row: 1 },
  status: "mock",
};

export const bookAssets = {
  barcode: withBase("/images/widgets/book/barcode.png"),
} as const;
