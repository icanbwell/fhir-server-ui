import { After, AfterAll, Before, BeforeAll, Status } from '@cucumber/cucumber';
import { chromium } from '@playwright/test';
import type { Browser } from '@playwright/test';
import { ensureAuthState } from '../global-setup.ts';
import type { CustomWorld } from './world.ts';

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
