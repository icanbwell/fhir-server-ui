import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { CustomWorld } from '../support/world';

// "Composition View" (ResourceCard's getCompositionSummaryLink) opens in a new tab -
// World#openLinkInNewTab handles the wait/click/tab-swap.
When('I view the composition summary', async function (this: CustomWorld) {
    await this.openLinkInNewTab('Composition View');
});

Then('I should see the composition summary', async function (this: CustomWorld) {
    await expect(this.page.getByRole('link', { name: /view raw json/i })).toBeVisible({ timeout: 15000 });
});
