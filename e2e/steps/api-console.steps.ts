import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { CustomWorld } from '../support/world';

When('I open the API console', async function (this: CustomWorld) {
    await this.page.goto(`${this.baseURL}/api-console`);
});

When('I set the request path to {string}', async function (this: CustomWorld, path: string) {
    await this.page.getByLabel('Request Path').fill(path);
});

When('I send the request', async function (this: CustomWorld) {
    await this.page.getByRole('button', { name: /^send$/i }).click();
});

Then('I should see a successful response', async function (this: CustomWorld) {
    await expect(this.page.getByText('200', { exact: true })).toBeVisible({ timeout: 15000 });
});
