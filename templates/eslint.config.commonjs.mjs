import { defineConfig } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import stylisticJs from '@stylistic/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier/flat';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    { ignores: ['lib/', 'dist/', 'build/', 'coverage/', '.husky/', 'assets/'] },
    {
        extends: [...compat.extends('eslint:recommended')],
        files: ['{src,test}/**/*.js'],

        plugins: {
            '@stylistic': stylisticJs
        },

        languageOptions: {
            globals: {
                ...globals.node,
            },
            ecmaVersion: 8,
            sourceType: 'commonjs',
        },

        rules: {
            'no-empty': 'warn',
            'no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ],
            '@stylistic/quotes': ['error', 'single'],
            '@stylistic/quote-props': ['error', 'as-needed']
        }
    },
    eslintConfigPrettier
]);