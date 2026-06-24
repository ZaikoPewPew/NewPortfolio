import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import path from "node:path";

export default defineConfig({
  integrations: [mdx()],
  vite: {
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
  },
});
