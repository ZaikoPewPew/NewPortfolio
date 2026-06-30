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
  photo: {
    mode: (import.meta.env.PUBLIC_PHOTO_MODE ?? "mock") as DataSourceMode,
  },
  bento: {
    mode: (import.meta.env.PUBLIC_BENTO_MODE ?? "mock") as DataSourceMode,
  },
} as const;
