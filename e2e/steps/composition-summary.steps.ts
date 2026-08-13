import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { CustomWorld } from '../support/world';

// "Composition View" (ResourceCard's getCompositionSummaryLink) opens in a new tab, same
// pattern as document-viewer.steps.ts's "I view the document".
When('I view the composition summary', async function (this: CustomWorld) {
    const [newPage] = await Promise.all([
        this.context.waitForEvent('page'),
        this.page.getByRole('link', { name: 'Composition View', exact: true }).first().click(),
    ]);
    await newPage.waitForLoadState();
    this.page = newPage;
});

Then('I should see the composition summary', async function (this: CustomWorld) {
    await expect(this.page.getByRole('link', { name: /view raw json/i })).toBeVisible({ timeout: 15000 });
});
