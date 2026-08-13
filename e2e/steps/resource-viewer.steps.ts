import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { CustomWorld } from '../support/world';

When('I open the first search result', async function (this: CustomWorld) {
    await this.page.getByRole('button', { name: /^open$/i }).first().click();
});

Then("I should see that resource's detail", async function (this: CustomWorld) {
    await expect(this.page.getByRole('button', { name: /^close$/i }).first()).toBeVisible({ timeout: 10000 });
});
