import { defineConfig, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  assetsInclude: ["**/*.wasm"],
  worker: {
    format: "es",
  },
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@provablehq/wasm"],
  },
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd())],
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
