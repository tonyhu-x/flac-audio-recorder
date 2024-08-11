import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default [
  { languageOptions: { globals: globals.browser } },
  {
    files: ['*.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/jsx-quotes': ['error', 'prefer-single'],
    },
  },
  stylistic.configs.customize({ semi: true }),
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
