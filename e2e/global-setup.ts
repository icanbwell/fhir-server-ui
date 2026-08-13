import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

// Storage state saved here after a real (one-time) sign-in. Authenticated scenarios reuse it
// instead of clicking through the login form every run - see the reference methodology this
// harness follows: docs/testing-plan.md's "Auth strategy" section.
export const AUTH_STATE_PATH = path.join(process.cwd(), 'e2e', '.auth', 'state.json');

// Client-credentials sign-in is a single POST (no interactive redirect), so driving the real
// login form once here is just as fast as hand-replicating what it writes to local storage -
// and it stays correct automatically if that internal shape ever changes.
//
// `baseURL` is passed in (from hooks.ts's BeforeAll, which reads it off cucumber.cjs's
// worldParameters) rather than re-reading E2E_BASE_URL here too - keeps the
// 'http://localhost:5051' fallback defined in exactly one place.
export async function ensureAuthState(baseURL: string): Promise<void> {
    const clientId = process.env.E2E_CLIENT_ID;
    const clientSecret = process.env.E2E_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        console.warn(
            '[e2e] E2E_CLIENT_ID / E2E_CLIENT_SECRET are not set - skipping saved auth state. ' +
                'Scenarios that call `authenticate()` will fail until these are provided.'
        );
        return;
    }

    mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });

    const browser = await chromium.launch();
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(`${baseURL}/client-credentials-login`);
        await page.getByLabel('Client ID').fill(clientId);
        await page.getByLabel('Client Secret').fill(clientSecret);
        await page.getByRole('button', { name: /sign in/i }).click();
        await page.getByRole('button', { name: /logout/i }).waitFor({ timeout: 15000 });
        await context.storageState({ path: AUTH_STATE_PATH });
        await context.close();
    } finally {
        await browser.close();
    }
}
