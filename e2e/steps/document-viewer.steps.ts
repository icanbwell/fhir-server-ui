import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { CustomWorld } from '../support/world';

// DocumentViewerLink opens in a new tab (target="_blank") - World#openLinkInNewTab handles the
// wait/click/tab-swap.
When('I view the document', async function (this: CustomWorld) {
    await this.openLinkInNewTab('View');
});

Then('I should see the document preview', async function (this: CustomWorld) {
    await expect(this.page.getByText(/^DocumentReference\//)).toBeVisible({ timeout: 15000 });
});
