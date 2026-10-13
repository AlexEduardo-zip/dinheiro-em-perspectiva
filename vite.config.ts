import { defineConfig } from "vite";

// base relativa: funciona em GitHub Pages / qualquer subpasta sem configurar.
export default defineConfig({
  base: "./",
  build: { target: "es2022" },
});
