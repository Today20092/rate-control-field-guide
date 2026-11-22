import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import astro from 'eslint-plugin-astro'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y-x'
import globals from 'globals'

export default defineConfig(
  { ignores: ['dist/', '.astro/', 'node_modules/', '.impeccable/', '.claude/', '.agents/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  ...astro.configs['flat/jsx-a11y-recommended'],
  {
    files: ['**/*.tsx'],
    ...jsxA11y.configs.recommended,
    ...reactHooks.configs.flat['recommended-latest'],
    plugins: {
      ...jsxA11y.configs.recommended.plugins,
      ...reactHooks.configs.flat['recommended-latest'].plugins,
    },
    rules: { ...jsxA11y.configs.recommended.rules, ...reactHooks.configs.flat['recommended-latest'].rules },
  },
  {
    // Widgets are leaves: they may use lib/ and content/, never pages or layouts.
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/pages/**', '**/layouts/**'],
              message: 'Components must not import pages or layouts; pass data in as props.',
            },
          ],
        },
      ],
    },
  },
  { files: ['scripts/**/*.mjs', '*.config.*'], languageOptions: { globals: globals.node } },
)
