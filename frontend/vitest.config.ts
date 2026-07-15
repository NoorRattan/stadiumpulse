import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

/** Vitest configuration for component and accessibility tests. */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        branches: 51,
        functions: 68,
        lines: 60,
        statements: 59,
      },
    },
    environment: "jsdom",
    exclude: ["e2e/**", "node_modules/**", "dist/**", "test-results/**"],
    globals: true,
    setupFiles: "./src/setupTests.ts",
    // Coverage instrumentation and axe analysis can exceed ten seconds on
    // shared CI runners even though the same test completes quickly locally.
    testTimeout: 30_000,
  },
});
