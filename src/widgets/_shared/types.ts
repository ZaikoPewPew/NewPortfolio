export interface WidgetGridSpan {
  col: number;
  row: number;
}

export type WidgetLayout = "square" | "wide";

export interface WidgetConfig {
  id: string;
  ariaLabel: string;
  layout: WidgetLayout;
  grid: WidgetGridSpan;
  status: "planned" | "mock" | "live";
}

export type DataSourceMode = "mock" | "api";
