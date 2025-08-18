import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  return {
    base: "/vocab/",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: [],
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          disableDevLogs: true,
          navigateFallback: null,
          runtimeCaching: [],
          sourcemap: false,
        },
        disable: false,
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "masked-icon.svg",
        ],
        manifest: {
          name: "VocabBoost AI",
          short_name: "VocabBoost",
          description:
            "AI-powered vocabulary learning app with spaced repetition",
          theme_color: "#101010",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait",
          scope: "/vocab/",
          start_url: "/vocab/",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
    ],
  };
});
