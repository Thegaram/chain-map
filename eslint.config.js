import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.svelte'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
        extraFileExtensions: ['.svelte']
      },
      globals: {
        ...globals.browser,
        ...globals.es2017,
        ...globals.node,
        __COMMIT_HASH__: 'readonly',
        FileSystemHandlePermissionDescriptor: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off'
    }
  },
  ...svelte.configs['flat/recommended'],
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: typescriptParser
      }
    },
    rules: {
      'svelte/no-at-html-tags': 'off',
      'svelte/require-each-key': 'warn' // Downgrade to warning for now
    }
  },
  prettier,
  {
    ignores: ['dist/', 'node_modules/', '*.cjs', 'vite.config.ts.timestamp-*']
  }
];
