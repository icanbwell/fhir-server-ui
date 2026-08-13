import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { CustomWorld } from '../support/world';

Then('I should see the not found page', async function (this: CustomWorld) {
    await expect(this.page.getByRole('heading', { name: 'Oops!' })).toBeVisible();
});
