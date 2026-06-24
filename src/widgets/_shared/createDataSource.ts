import type { DataSourceMode } from "./types";

export function createDataSource<T>(options: {
  mode: DataSourceMode;
  mock: () => T | Promise<T>;
  api: () => T | Promise<T>;
}): () => Promise<T> {
  return async () => (options.mode === "api" ? options.api() : options.mock());
}
