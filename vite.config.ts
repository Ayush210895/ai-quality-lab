import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/ai-quality-lab/",
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.tsx"],
    setupFiles: "./src/test-setup.ts",
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: "index.html",
        qualityLab: "quality-lab/index.html",
      },
      output: {
        manualChunks(id) {
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("react")) return "react";
          if (id.includes("zod")) return "validation";
        },
      },
    },
  },
});
