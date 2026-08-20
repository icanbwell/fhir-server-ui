import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { CustomWorld } from '../support/world';

// "Compositions" (ResourceCard's getCompositionIndexLink) opens in a new tab, same pattern as
// composition-summary.steps.ts's "Composition View" link - World#openLinkInNewTab handles the
// wait/click/tab-swap.
When('I open the composition index for the first search result', async function (this: CustomWorld) {
    await this.openLinkInNewTab('Compositions');
});

Then(
    'I should see the composition index or a {string} message',
    async function (this: CustomWorld, emptyMessage: string) {
        const noResults = this.page.getByText(emptyMessage);
        const hasResults = this.page.getByRole('table');
        await expect(noResults.or(hasResults)).toBeVisible({ timeout: 15000 });
    }
);
