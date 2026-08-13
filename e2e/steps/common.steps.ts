import { Given, When } from '@cucumber/cucumber';
import type { CustomWorld } from '../support/world';

Given('I am signed in', async function (this: CustomWorld) {
    await this.authenticate();
});

When('I navigate to {string}', async function (this: CustomWorld, path: string) {
    await this.page.goto(`${this.baseURL}${path}`);
});
