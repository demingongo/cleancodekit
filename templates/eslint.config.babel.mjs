import { defineConfig } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import stylisticJs from '@stylistic/eslint-plugin'
import importPlugin from 'eslint-plugin-import';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import babelParser from '@babel/eslint-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    { ignores: ['lib/', 'dist/', 'build/', 'coverage/', '.husky/', 'assets/', 'docs/'] },
    {
        extends: [...compat.extends('eslint:recommended', 'plugin:import/recommended')],
        files: ['{src,test}/**/*.{js,mjs}'],

        plugins: {
            '@stylistic': stylisticJs,
            import: importPlugin
        },

        languageOptions: {
            globals: {
                ...globals.node,
            },
            parser: babelParser,
            ecmaVersion: 8,
            sourceType: 'module',
        },

        rules: {
            'import/no-commonjs': 'off', // because using eslint-plugin-import
            'import/named': 'off', // remove if you don't want to use 'module.exports' anymore
            'import/default': 'off', // same as above
            'import/no-cycle': ['error', { maxDepth: Infinity }],
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
        },
        settings: {
            'import/parsers': {
                '@babel/eslint-parser': ['.js', '.mjs'],
            },
            'import/resolver': {
                node: {
                    extensions: ['.js', '.mjs'],
                },
            },
        }
    },
    eslintConfigPrettier
]);