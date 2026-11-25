import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./src/test/mocks/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.spec.ts"],
    globalSetup: ["src/test/vitest.global-setup.ts"],
    setupFiles: ["src/test/vitest.setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
