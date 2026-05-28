import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), nodePolyfills()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ["localhost", ".krishlabs.tech", ".axion.krishlabs.tech"],
  },
  optimizeDeps: {
    include: [
      "three-globe",
      "@react-three/drei",
      "@react-three/fiber",
      "three",
    ],
  },
});
