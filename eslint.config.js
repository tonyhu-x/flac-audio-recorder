import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default [
  {
    ignores: ['src/libflacjs', 'dist'],
  },
  { languageOptions: { globals: globals.browser } },
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
