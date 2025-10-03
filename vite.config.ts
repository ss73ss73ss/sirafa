import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// config async لأننا نستخدم await import
export default defineConfig(async () => ({
  // مهم لـ GitHub Pages (استبدل sirafaa باسم المستودع)
  base: "/sirafa/", 
 build: { outDir: "dist/public", emptyOutDir: true },
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
          (await import("@replit/vite-plugin-cartographer")).cartographer(),
        ]
      : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  // مشروعك الفرونت داخل client
  root: path.resolve(import.meta.dirname, "client"),

  // خلّها dist حتى تطابق سكربت النشر gh-pages -d dist
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
}));
