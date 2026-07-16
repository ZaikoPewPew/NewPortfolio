import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import path from "node:path";

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const site =
  process.env.SITE_URL ??
  (isGitHubActions
    ? `https://${process.env.GITHUB_REPOSITORY_OWNER}.github.io`
    : undefined);
const base = process.env.BASE_PATH ?? (isGitHubActions ? `/${process.env.GITHUB_REPOSITORY?.split("/")[1] ?? ""}` : "/");

export default defineConfig({
  site,
  base,
  integrations: [mdx()],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ru"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
  },
});
