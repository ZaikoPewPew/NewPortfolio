import type { WidgetConfig } from "../_shared/types";

export const PHOTO_SLIDE_DURATION_MS = 5000;

export const photoConfig: WidgetConfig = {
  id: "photo",
  ariaLabel: "Фотогалерея",
  layout: "square",
  grid: { col: 1, row: 1 },
  status: "mock",
};
