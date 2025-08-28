// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",

    // Only look for tests under src/**/__tests__/
    include: ["src/**/__tests__/**/*.test.ts"],

    // Never crawl these paths for tests
    exclude: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "docs/**",
      "scripts/**",
      "examples/**",
      // editor/ci noise
      ".idea/**",
      ".vscode/**",
      // type-only or build artifacts
      "**/*.d.ts",
      // docs, fixtures and test helpers
      "**/fixtures/**",
      "**/docs/**",
      "**/__tests__/_shared/**",
      "**/__tests__/_utils/**",
    ],

    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      cleanOnRerun: true,

      // Measure coverage only from source files, not dist/configs
      include: ["src/**/*.ts"],

      // Exclude files that are type-only or barrels/config
      exclude: [
        "src/**/index.ts", // endpoint barrels + root barrel
        "src/**/requests.ts", // type-only
        "src/**/responses.ts", // type-only
        "src/**/*.d.ts",

        // build/runtime outputs & configs
        ".vscode/**",
        "dist/**",
        "coverage/**",
        "vitest.config.ts",
        "eslint.config.*",
        "scripts/**",

        // docs, fixtures and test helpers
        "**/fixtures/**",
        "**/docs/**",
        "**/__tests__/_shared/**",
        "**/__tests__/_utils/**",
      ],
    },
  },
  resolve: {
    // If you want a clean import alias for tests (optional):
    alias: {
      zodgecko: new URL("./src/index.ts", import.meta.url).pathname,
    },
  },
});
