import js from "@eslint/js";
import next from "eslint-config-next";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"] },
  ...next,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // project-specific overrides if needed
    },
  },
];
