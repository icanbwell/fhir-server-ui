import { existsSync } from 'node:fs';
import { setWorldConstructor, World } from '@cucumber/cucumber';
import type { IWorldOptions } from '@cucumber/cucumber';
import type { Browser, BrowserContext, Page, Response } from '@playwright/test';
import { AUTH_STATE_PATH } from '../global-setup.ts';

export interface WorldParameters {
    baseURL: string;
}

export class CustomWorld extends World<WorldParameters> {
    browser!: Browser;
    context!: BrowserContext;
    page!: Page;
    // Scenario-scoped scratch data set by search.steps.ts's "When" step and read by its "Then"
    // step - the standard Cucumber pattern for passing data between steps in the same scenario.
    lastSearchResponse?: Response;

    constructor(options: IWorldOptions<WorldParameters>) {
        super(options);
    }

    get baseURL(): string {
        return this.parameters.baseURL;
    }

    // Swaps the scenario's fresh, unauthenticated context for one preloaded with the storage
    // state saved by ensureAuthState() - reuse this in step definitions for any scenario that
    // needs to start already signed in, instead of driving the login form every time.
    async authenticate(): Promise<void> {
        if (!existsSync(AUTH_STATE_PATH)) {
            throw new Error(
                `No saved auth state at ${AUTH_STATE_PATH}. Set E2E_CLIENT_ID/E2E_CLIENT_SECRET ` +
                    'so global setup can sign in once before the suite runs.'
            );
        }
        await this.context.close();
        this.context = await this.browser.newContext({ storageState: AUTH_STATE_PATH });
        this.page = await this.context.newPage();
    }

    // Several detail views (Document Viewer, Composition Summary) link out via
    // target="_blank". Swaps `page` to the tab that opens, so later steps keep working against
    // wherever the click actually landed - same as a real user following the link.
    async openLinkInNewTab(linkName: string): Promise<void> {
        const [newPage] = await Promise.all([
            this.context.waitForEvent('page'),
            this.page.getByRole('link', { name: linkName, exact: true }).first().click(),
        ]);
        await newPage.waitForLoadState();
        this.page = newPage;
    }
}

setWorldConstructor(CustomWorld);
