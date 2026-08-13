import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { CustomWorld } from '../support/world';

When('I search for {string} resources', async function (this: CustomWorld, resourceType: string) {
    await this.page.goto(`${this.baseURL}/4_0_0/${resourceType}/_search/`);
    const responsePromise = this.page.waitForResponse(
        (response) =>
            response.url().includes(`/4_0_0/${resourceType}`) && response.request().method() === 'GET'
    );
    // Scoped to the search form itself: MUI's AccordionSummary above it also exposes an
    // accessible "Search" button role, so an unscoped getByRole('button', { name: /^search$/i })
    // matches both and Playwright throws a strict-mode violation.
    await this.page.locator('form').getByRole('button', { name: /^search$/i }).click();
    this.lastSearchResponse = await responsePromise;
});

Then(
    'I should see search results or a {string} message',
    async function (this: CustomWorld, emptyMessage: string) {
        // Without this, a non-2xx error response (400/403/500) whose JSON body falls through to
        // IndexPage's default render branch could show up looking like a "coherent result" -
        // this pins the assertion to an actual successful search, not just some rendered content.
        expect(this.lastSearchResponse?.ok()).toBe(true);

        const noResults = this.page.getByText(emptyMessage, { exact: true });
        const hasResults = this.page.getByRole('link', { name: /open search results as spreadsheet/i });
        await expect(noResults.or(hasResults)).toBeVisible({ timeout: 20000 });
    }
);
