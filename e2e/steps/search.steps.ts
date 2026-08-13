import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { CustomWorld } from '../support/world';

When('I search for {string} resources', async function (this: CustomWorld, resourceType: string) {
    await this.page.goto(`${this.baseURL}/4_0_0/${resourceType}/_search/`);
    await this.page.getByRole('button', { name: /^search$/i }).click();
});

Then(
    'I should see search results or a {string} message',
    async function (this: CustomWorld, emptyMessage: string) {
        const noResults = this.page.getByText(emptyMessage, { exact: true });
        const hasResults = this.page.getByRole('link', { name: /open search results as spreadsheet/i });
        await expect(noResults.or(hasResults)).toBeVisible({ timeout: 20000 });
    }
);
