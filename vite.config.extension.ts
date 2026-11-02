import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist-extension",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        popup: path.resolve(__dirname, "popup.html"),
        background: path.resolve(__dirname, "src/extension/background.ts"),
        content: path.resolve(__dirname, "src/extension/content.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") return "background.js";
          if (chunkInfo.name === "content") return "content.js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
  plugins: [
    react(),
    {
      name: "virtual-pwa-stub",
      resolveId(id) {
        if (id === "virtual:pwa-register") return "\0virtual:pwa-register";
      },
      load(id) {
        if (id === "\0virtual:pwa-register") {
          return "export const registerSW = () => {};";
        }
      },
    },
    {
      name: "copy-extension-metadata",
      closeBundle() {
        const outDir = path.resolve(__dirname, "dist-extension");
        
        // Copy manifest.json
        fs.copyFileSync(
          path.resolve(__dirname, "src/extension/manifest.json"),
          path.resolve(outDir, "manifest.json")
        );
        console.log("✓ Copied manifest.json to dist-extension/");

        // Copy rules.json
        fs.copyFileSync(
          path.resolve(__dirname, "src/extension/rules.json"),
          path.resolve(outDir, "rules.json")
        );
        console.log("✓ Copied rules.json to dist-extension/");
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
