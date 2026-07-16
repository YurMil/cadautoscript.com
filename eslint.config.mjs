import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Lint only first-party code. Vendored utility bundles (static/), generated
// output and Supabase edge functions (Deno globals) are out of scope.
export default tseslint.config(
  {
    ignores: [
      'build/**',
      '.docusaurus/**',
      'node_modules/**',
      'static/**',
      'supabase/**',
      'dev-plans/**',
      'dev new utility/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  {
    files: ['src/**/*.{ts,tsx}', 'api/**/*.ts', 'scripts/**/*.{js,mjs}', '*.{ts,js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Route logging through src/lib/logger instead of the console directly
      // (issue #80). logger silences non-error logs in production.
      'no-console': 'error',
      // Existing code relies on these patterns; tighten gradually (issue #57).
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {argsIgnorePattern: '^_', varsIgnorePattern: '^_'},
      ],
      // React Compiler-era rules from react-hooks v7: real findings, but too
      // many pre-existing hits to fail CI on. Keep visible as warnings.
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
  {
    // Build scripts are CommonJS by design.
    files: ['scripts/**/*.js', 'postcss.config.js', 'tailwind.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // The logger wrapper and build scripts are allowed to use the console.
    files: ['src/lib/logger.ts', 'scripts/**/*.js', 'api/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);
