import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import security from 'eslint-plugin-security';

export default [
    {
        ignores: [
            '**/*.json',
            '**/*.config.js',
            '**/*.config.ts',
            'dist/**',
            'node_modules/**',
            'build/**',
        ],
    },
    {
        ...reactPlugin.configs.flat.recommended,
        settings: {
            react: { version: 'detect' },
        },
    },
    {
        ...reactPlugin.configs.flat['jsx-runtime'],
        settings: {
            react: { version: 'detect' },
        },
    },
    security.configs.recommended,
    {
        files: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'],
        plugins: {
            '@typescript-eslint': tsPlugin,
            'react-hooks': reactHooks,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
            },
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: 'module',
        },
        rules: {
            ...reactHooks.configs.recommended.rules,

            'no-console': 0,
            'no-debugger': 2,
            'no-array-constructor': 2,
            'no-caller': 2,
            'no-eval': 2,
            'no-extend-native': 2,
            'no-extra-bind': 2,
            'no-implied-eval': 2,
            'no-iterator': 2,
            'no-label-var': 2,
            'no-labels': 2,
            'no-lone-blocks': 2,
            'no-loop-func': 2,
            'no-multi-str': 2,
            'no-new': 2,
            'no-new-func': 2,
            'no-new-wrappers': 2,
            'no-octal-escape': 2,
            'no-proto': 2,
            'no-return-assign': 2,
            'no-script-url': 2,
            'no-sequences': 2,
            'no-shadow-restricted-names': 2,
            'no-undef-init': 2,
            'no-unused-expressions': 2,
            'no-with': 2,
            'curly': [2, 'all'],
            'eqeqeq': 2,
            'new-parens': 2,
            'yoda': [2, 'never'],

            // TypeScript-aware rules (replaces no-undef and no-unused-vars)
            'no-undef': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error', {
                vars: 'all',
                args: 'after-used',
                argsIgnorePattern: '^_',
            }],
            '@typescript-eslint/no-explicit-any': 'off',

            // Disabled: this flags legitimate data-fetching patterns (setState after await/then)
            'react-hooks/set-state-in-effect': 'off',

            // Security
            'security/detect-non-literal-fs-filename': 'off',
        },
    },
];
