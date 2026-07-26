import { defineConfig } from "vite";

export default defineConfig({
  // Relative base so dist/ can be served from any path, not just domain root.
  base: "./",
  // Without this, Vite treats .nes as an unknown import and fails to emit it.
  assetsInclude: ["**/*.nes"],
  build: {
    // The ROM is ~40KB; keep it a real file rather than a base64 data URI.
    assetsInlineLimit: 0,
  },
  server: {
    fs: {
      // The ROM lives outside this Vite root (../build). The repo root has no
      // package.json, so Vite's inferred workspace root is web/ itself and the
      // dev server would 403 the ROM without this.
      allow: [".."],
    },
  },
});
