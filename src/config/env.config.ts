export type DataSourceMode = "mock" | "api";

export const env = {
  spotify: {
    mode: (import.meta.env.PUBLIC_SPOTIFY_MODE ?? "mock") as DataSourceMode,
  },
  github: {
    mode: (import.meta.env.PUBLIC_GITHUB_MODE ?? "mock") as DataSourceMode,
  },
  me: {
    mode: (import.meta.env.PUBLIC_ME_MODE ?? "mock") as DataSourceMode,
  },
} as const;
