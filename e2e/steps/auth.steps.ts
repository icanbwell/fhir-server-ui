import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { CustomWorld } from '../support/world';

function requireE2eCredentials(): { clientId: string; clientSecret: string } {
    const clientId = process.env.E2E_CLIENT_ID;
    const clientSecret = process.env.E2E_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error(
            'E2E_CLIENT_ID / E2E_CLIENT_SECRET must be set to run @requires-e2e-credentials scenarios.'
        );
    }
    return { clientId, clientSecret };
}

Given('I am on the client credentials login page', async function (this: CustomWorld) {
    await this.page.goto(`${this.baseURL}/client-credentials-login`);
});

When('I sign in with valid client credentials', async function (this: CustomWorld) {
    const { clientId, clientSecret } = requireE2eCredentials();
    await this.page.getByLabel('Client ID').fill(clientId);
    await this.page.getByLabel('Client Secret').fill(clientSecret);
    await this.page.getByRole('button', { name: /sign in/i }).click();
});

When('I sign in with an invalid client secret', async function (this: CustomWorld) {
    const { clientId } = requireE2eCredentials();
    await this.page.getByLabel('Client ID').fill(clientId);
    await this.page.getByLabel('Client Secret').fill('not-a-valid-secret-for-e2e-test');
    await this.page.getByRole('button', { name: /sign in/i }).click();
});

Then('I should be signed in', async function (this: CustomWorld) {
    await expect(this.page.getByRole('button', { name: /logout/i })).toBeVisible({ timeout: 15000 });
});

Then('I should see a sign-in error', async function (this: CustomWorld) {
    await expect(this.page.getByRole('alert')).toBeVisible({ timeout: 10000 });
});

Then('I should still be on the client credentials login page', async function (this: CustomWorld) {
    expect(this.page.url()).toContain('/client-credentials-login');
});
