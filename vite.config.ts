import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the app from /cheme-toolkit/; set PAGES_BASE to change it (e.g. "/" for a custom domain).
export default defineConfig({
  base: process.env.PAGES_BASE ?? "./",
  plugins: [react()],
  build: { chunkSizeWarningLimit: 800 },
});
