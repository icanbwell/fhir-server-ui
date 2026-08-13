import { After, AfterAll, Before, BeforeAll, setDefaultTimeout, Status } from '@cucumber/cucumber';
import { chromium } from '@playwright/test';
import type { Browser } from '@playwright/test';
import { ensureAuthState } from '../global-setup.ts';
import type { CustomWorld } from './world.ts';

// Cucumber's own step timeout defaults to 5000ms, well under some of this suite's Playwright
// waits (e.g. search.steps.ts's 20000ms) - without raising it, Cucumber kills the step before
// Playwright's own retry window elapses, silently capping the intended wait. Set comfortably
// above the longest per-step wait anywhere in the suite.
setDefaultTimeout(30 * 1000);

let browser: Browser;

BeforeAll(async function () {
    await ensureAuthState();
    browser = await chromium.launch({
        headless: !process.env.HEADED,
        slowMo: process.env.SLOWMO ? Number(process.env.SLOWMO) : process.env.HEADED ? 250 : 0,
    });
});

AfterAll(async function () {
    await browser.close();
});

Before(async function (this: CustomWorld) {
    this.browser = browser;
    this.context = await browser.newContext();
    this.page = await this.context.newPage();
});

After(async function (this: CustomWorld, { result }) {
    if (result?.status === Status.FAILED) {
        const screenshot = await this.page.screenshot();
        this.attach(screenshot, 'image/png');
    }
    await this.context.close();
});
