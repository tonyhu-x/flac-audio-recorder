import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  stylistic.configs.customize({ semi: true }),
  {
    files: [
      'src/**/*.tsx',
      'src/**/*.jsx',
    ],
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/jsx-quotes': ['error', 'prefer-single'],
    },
  },
];
