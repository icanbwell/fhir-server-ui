import { When } from '@cucumber/cucumber';
import type { CustomWorld } from '../support/world';

When('I navigate to {string}', async function (this: CustomWorld, path: string) {
    await this.page.goto(`${this.baseURL}${path}`);
});
