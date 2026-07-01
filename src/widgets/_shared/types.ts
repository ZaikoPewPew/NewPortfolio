export interface WidgetGridSpan {
  col: number;
  row: number;
}

export type WidgetLayout = "square" | "wide";

export interface WidgetConfig {
  id: string;
  /** Задаётся в i18n, если виджет переводимый */
  ariaLabel?: string;
  layout: WidgetLayout;
  grid: WidgetGridSpan;
  status: "planned" | "mock" | "live";
}

export type DataSourceMode = "mock" | "api";
