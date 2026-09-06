import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.js"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.js"],
          setupFiles: ["tests/setup.integration.js"],
          // All integration tests share one MySQL database — files must run
          // one at a time so their TRUNCATE/insert fixtures don't collide.
          fileParallelism: false,
        },
      },
    ],
    testTimeout: 15000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.js"],
      exclude: ["src/server.js"],
    },
  },
});
