import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brandColors } from './brandColors';

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

const toCssVariable = (key: string) =>
    '--bwell-' + key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

const darkModeTokens = Object.entries(brandColors).filter(([key]) => key.startsWith('darkMode'));

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('index.css dark-mode tokens', () => {
    it.each(darkModeTokens)('declares a CSS variable mirroring brandColors.%s', (key, value) => {
        const variable = toCssVariable(key);
        const declaration = new RegExp(`${escapeRegExp(variable)}:\\s*([^;]+);`);

        const match = css.match(declaration);

        expect(match, `${variable} is not declared in index.css`).not.toBeNull();
        expect(match![1].trim().toLowerCase()).toBe(value.toLowerCase());
    });
});

describe('index.css dark-mode link rules', () => {
    const base = '\\.dark-mode a:not\\(\\.MuiButton-root\\):not\\(\\.MuiButtonBase-root\\)';

    it.each([
        ['base', '', '--bwell-dark-mode-primary'],
        ['visited', ':visited', '--bwell-dark-mode-primary'],
        ['hover', ':hover', '--bwell-dark-mode-primary-hover'],
    ])('styles the %s link state with the dark-mode token', (_state, pseudo, variable) => {
        const rule = new RegExp(`${base}${pseudo}\\s*\\{[^}]*color:\\s*var\\(${variable}\\)`);

        expect(css).toMatch(rule);
    });
});
