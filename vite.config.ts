import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  server: {
    proxy: {
      "/web-api": {
        target: "https://api.ashiato-kai.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/web-api/, ""),
      },
    },
  },
});
