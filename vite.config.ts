import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  server: {
    port: 3000,
    allowedHosts: [],
  },
  assetsInclude: ["**/*.gltf", "**/*.glb"],
});
