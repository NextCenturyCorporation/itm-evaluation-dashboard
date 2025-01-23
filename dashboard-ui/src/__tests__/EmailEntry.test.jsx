/**
 * @jest-environment puppeteer
 */

import { countElementsWithText } from "../__mocks__/testUtils";

describe('Test email-entry text scenarios', () => {

    it('/participantText should only have email-entry option', async () => {
        await page.goto('http://localhost:3000/participantText');
        await page.waitForSelector('text=Loading...', { hidden: true });
        const currentUrl = page.url();
        expect(currentUrl).toBe('http://localhost:3000/participantText');

        let count = await countElementsWithText(page, "Sign In");
        expect(count).toBe(0);

        count = await countElementsWithText(page, "Create Account");
        expect(count).toBe(0);

        count = await countElementsWithText(page, "Text Scenario Login");
        expect(count).toBeGreaterThan(0);
        // long-running test, needs greater timeout
    }, 10000);

    it('/participantText should error on non-duplicate email (case insensitive)', async () => {
        await page.goto('http://localhost:3000/participantText');
        await page.waitForSelector('text=Loading...', { hidden: true });
        const currentUrl = page.url();
        expect(currentUrl).toBe('http://localhost:3000/participantText');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('test@123.com');
        await email2.type('test@12.com');
        await page.waitForSelector('text=Email Mismatch');
    }, 10000);
});