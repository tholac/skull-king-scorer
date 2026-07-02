import { sveltekit } from "@sveltejs/kit/vite";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

const base = process.env.BASE_PATH ?? "";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    VitePWA({
      strategies: "generateSW",
      registerType: "prompt",
      manifest: {
        name: "Skore King: Skull King Scorer",
        short_name: "Skore King",
        description: "Yet another Skull King scorer, with enough features to board the ship!",
        theme_color: "#1d232a",
        background_color: "#1d232a",
        display: "standalone",
        start_url: base + "/",
        scope: base + "/",
        icons: [
          {
            src: base + "/favicon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: base + "/favicon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"] },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
    environment: "jsdom",
  },
});
