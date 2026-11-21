import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const isDemoMode = process.env.VITE_DEMO_MODE === "true";

const noopPwaPlugin = {
  name: "noop-pwa-register",
  resolveId(id) {
    if (id === "virtual:pwa-register") {
      return "\0virtual:pwa-register";
    }
  },
  load(id) {
    if (id === "\0virtual:pwa-register") {
      return "export function registerSW() { return () => {}; }";
    }
  },
};

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [
    react(),
    ...(isDemoMode
      ? [noopPwaPlugin]
      : [
          VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["logo.jpg", "icon-192x192.png", "icon-512x512.png"],
            manifest: {
              name: "NX",
              short_name: "NX",
              description: "NX Cryptocurrency Exchange Simulator",
              theme_color: "#111111",
              background_color: "#111111",
              display: "standalone",
              icons: [
                {
                  src: "icon-192x192.png",
                  sizes: "192x192",
                  type: "image/png",
                },
                {
                  src: "icon-512x512.png",
                  sizes: "512x512",
                  type: "image/png",
                },
              ],
            },
            devOptions: {
              enabled: true,
            },
          }),
        ]),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
