import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    // ... existing plugins
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "interfaces/web-frontend", "src"),
      "@shared": path.resolve(import.meta.dirname, "domains/shared-kernel/src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "interfaces/web-frontend"),

  // Server configuration to avoid port conflicts
  server: {
    hmr: {
      port: 24679, // Use a different port for HMR WebSocket
    },
  },

  // Add this build configuration:
  build: {
    outDir: "dist", // Relative to root (interfaces/web-frontend)
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
