import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { CustomWorld } from '../support/world';

// DocumentViewerLink opens in a new tab (target="_blank"), so this swaps the World's `page`
// to that new tab - later steps in the scenario keep working against wherever the user
// actually ended up, same as a real user following the link.
When('I view the document', async function (this: CustomWorld) {
    const [newPage] = await Promise.all([
        this.context.waitForEvent('page'),
        this.page.getByRole('link', { name: 'View', exact: true }).first().click(),
    ]);
    await newPage.waitForLoadState();
    this.page = newPage;
});

Then('I should see the document preview', async function (this: CustomWorld) {
    await expect(this.page.getByText(/^DocumentReference\//)).toBeVisible({ timeout: 15000 });
});
