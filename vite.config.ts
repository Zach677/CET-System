import { resolve } from "node:path";

import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

import { webAppManifest } from "./app/lib/web-app-manifest";

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "~": resolve(__dirname, "app"),
    },
    dedupe: ["react", "react-dom"],
  },
  plugins: [
    mode === "test" ? null : cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    VitePWA({
      outDir: "build/client",
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        ...webAppManifest,
        icons: webAppManifest.icons.map((icon) => ({ ...icon })),
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: {
              cacheName: "pages",
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === "image" ||
              request.destination === "font" ||
              request.destination === "style" ||
              request.destination === "script",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "assets",
            },
          },
        ],
        navigateFallback: "/offline.html",
      },
    }),
  ].filter(Boolean),
  test: {
    environment: "node",
    include: ["app/**/*.test.ts", "server/**/*.test.ts"],
    setupFiles: "./vitest.setup.ts",
  },
}));
