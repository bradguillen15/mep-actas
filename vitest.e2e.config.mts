import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["test/e2e/**/*.test.ts"],
    env: {
      TURSO_DATABASE_URL: `file:${path.resolve(__dirname, "temp-e2e.db")}`,
    },
    fileParallelism: false,
    globalSetup: ["./test/e2e/globalSetup.ts"],
  },
});
