// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  // Ignore build artifacts
  { ignores: ["dist/**", "build/**", "coverage/**", "node_modules/**", ".vscode/**"] },

  // JS baseline
  js.configs.recommended,

  // TS recommended + type-checked rules (we'll override project below)
  ...tseslint.configs.recommendedTypeChecked,

  // Our project-specific settings + rules
  {
    files: ["src/**/*.{ts,tsx}"], // limit type-aware linting to your sources
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.es2024, ...globals.browser },

      // IMPORTANT: point to a concrete tsconfig for type info
      parser: tseslint.parser,
      parserOptions: {
        project: [path.join(__dirname, "tsconfig.json")], // or "./tsconfig.json"
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      import: importPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: { alwaysTryTypes: true },
        node: { extensions: [".ts", ".tsx", ".js", ".mjs", ".json"] },
      },
    },
    rules: {
      // your rules from .eslintrc.json
      eqeqeq: "error",
      "no-implicit-coercion": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        { allowExpressions: true, allowHigherOrderFunctions: true },
      ],
      // Keep type-only imports clean (prevents value edges)
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-floating-promises": "error",

      "import/order": [
        "error",
        {
          groups: [["builtin", "external"], ["internal"], ["parent", "sibling", "index"]],
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
        },
      ],

      "prettier/prettier": "error",
      "import/extensions": [
        "error",
        "ignorePackages",
        { js: "always", mjs: "always", ts: "never", tsx: "never" },
      ],
      "import/no-cycle": ["error", { maxDepth: 1 }],
      // Barrels are for consumers only – never import them within src/**
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "**/src/index", // internal root barrel
            "zodgecko", // package name (from internal files),
            "../runtime",
          ],
        },
      ],
    },
  },

  // (optional) allow basic linting for stray JS/TS outside src without type info
  {
    files: ["**/*.{ts,tsx,js,mjs,cjs}"],
    ignores: ["src/**/*"], // avoid overlapping with the block above
    rules: {
      // keep it light here; no type-aware rules
    },
  },
];
