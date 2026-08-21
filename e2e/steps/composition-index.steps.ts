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
        // .first(): CompositionIndex.tsx renders up to two <Table>s (Health Summary + Other
        // Compositions) when a person has both - an unscoped locator matching >1 element throws
        // a strict-mode violation instead of resolving to pass/fail on visibility, same hazard
        // search.steps.ts hits with its "Search" button and fixes the same way.
        const hasResults = this.page.getByRole('table').first();
        await expect(noResults.or(hasResults)).toBeVisible({ timeout: 15000 });
    }
);
