export type DataSourceMode = "mock" | "api";

export const env = {
  book: {
    mode: (import.meta.env.PUBLIC_BOOK_MODE ?? "mock") as DataSourceMode,
  },
  github: {
    mode: (import.meta.env.PUBLIC_GITHUB_MODE ?? "api") as DataSourceMode,
  },
  me: {
    mode: (import.meta.env.PUBLIC_ME_MODE ?? "mock") as DataSourceMode,
  },
  photo: {
    mode: (import.meta.env.PUBLIC_PHOTO_MODE ?? "mock") as DataSourceMode,
  },
  bento: {
    mode: (import.meta.env.PUBLIC_BENTO_MODE ?? "mock") as DataSourceMode,
  },
  cases: {
    /** Включает кейсы с visibility: live в home и статичных путях. Default: false. */
    showLive: import.meta.env.PUBLIC_CASES_SHOW_LIVE === "true",
  },
} as const;
