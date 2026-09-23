/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react-refresh'],
  ignorePatterns: ['dist', 'node_modules', 'supabase/functions/**'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Context+hook pairs (useAuth, useTheme, useI18n) intentionally export both
    // a provider component and its hook from one file — the idiomatic pattern.
    'react-refresh/only-export-components': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
