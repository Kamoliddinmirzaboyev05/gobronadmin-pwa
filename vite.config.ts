import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        type: 'module',
      },
      injectRegister: 'auto',
      
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
        // localStorage'ni cache qilmaslik
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // API so'rovlarini cache qilmaslik
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
      manifest: {
        name: "GoBron Admin",
        short_name: "GoBron",
        description: "GoBron futbol maydonlari admin paneli",
        theme_color: "#10b981",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
