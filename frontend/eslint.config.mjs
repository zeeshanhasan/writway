import js from "@eslint/js";
import nextPlugin from "eslint-plugin-next";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextPlugin.configs["core-web-vitals"],
  {
    rules: {
      // project-specific overrides if needed
    },
  },
];
