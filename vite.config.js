import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // All API calls go to the backend — proxy locally, env var in prod
  server: {
    proxy: {
      "/auth": { target: "http://localhost:3001", changeOrigin: true },
      "/api":  { target: "http://localhost:3001", changeOrigin: true },
    },
  },
});
