import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"

import sitemap from "@astrojs/sitemap"

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  markdown: {
    drafts: true,
  },
  integrations: [mdx({ drafts: true }), sitemap()],
})
