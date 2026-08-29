import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap todavia usa @import y funciones de color legacy en su
        // propio .scss (node_modules, no lo tocamos nosotros) -- quietDeps
        // silencia esos avisos de dependencias externas sin ocultar
        // deprecation warnings que vengan de nuestro propio codigo.
        quietDeps: true,
        silenceDeprecations: ["import", "global-builtin", "color-functions", "legacy-js-api"],
      },
    },
  },
});
