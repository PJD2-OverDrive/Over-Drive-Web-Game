import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Aponta o alias para o código-fonte do shared, assim o Vite compila os .ts
// do monorepo sem precisar publicar o pacote.
const sharedSource = fileURLToPath(new URL("../shared/src/index.ts", import.meta.url));

export default defineConfig({
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      "@overdrive/shared": sharedSource,
    },
  },
});
