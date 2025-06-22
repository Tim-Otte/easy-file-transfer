import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default tseslint.config(
	includeIgnoreFile(gitignorePath),
	eslint.configs.recommended,
	tseslint.configs.recommended,
	tseslint.configs.stylistic,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: { 'no-undef': 'off' }
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: tseslint.parser,
				svelteConfig
			}
		}
	},
	{
		files: ['**/*.ts'],
		rules: {
			'@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
		}
	}
);
