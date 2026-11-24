import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base works on Vercel and any static host; set PAGES_BASE (e.g. "/cheme-toolkit/") to force an absolute base.
export default defineConfig({
  base: process.env.PAGES_BASE ?? "./",
  plugins: [react()],
  build: { chunkSizeWarningLimit: 800 },
});
