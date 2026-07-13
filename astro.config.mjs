import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import path from "node:path";

export default defineConfig({
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
