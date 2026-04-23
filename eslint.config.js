import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactCompiler from "eslint-plugin-react-compiler";
import tanstackQuery from "@tanstack/eslint-plugin-query";
import tanstackRouter from "@tanstack/eslint-plugin-router";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      ".wrangler/**",
      ".tanstack/**",
      "node_modules/**",
      "src/**/*.gen.ts",
      "src/**/*.gen.json",
      "src/routeTree.gen.ts",
      "worker-configuration.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactCompiler.configs.recommended,
  ...tanstackQuery.configs["flat/recommended"],
  ...tanstackRouter.configs["flat/recommended"],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Bridging Deco/commerce types frequently needs `any`. Tighten later.
      "@typescript-eslint/no-explicit-any": "off",
      // Underscore-prefixed args are intentional placeholders.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // React 19 + new JSX transform — no React-in-scope requirement.
      "no-undef": "off",
    },
  },
  // Deco loaders/actions run server-side. They legitimately call `usePlatform`
  // (deco convention naming, not a React hook) outside of React.
  {
    files: ["src/loaders/**/*.{ts,tsx}", "src/actions/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-compiler/react-compiler": "off",
    },
  },
);
