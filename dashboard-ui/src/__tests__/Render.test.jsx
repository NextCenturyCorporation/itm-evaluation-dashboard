/**
 * @jest-environment puppeteer
 */

import { countElementsWithText } from "../__mocks__/testUtils";

jest.unmock('@accounts/client');
jest.unmock('@accounts/graphql-client');
jest.unmock('@accounts/client-password');

describe('Test render and bad login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('app should render successfully', async () => {
        await page.goto('http://localhost:3000/');

        // Test that the login page is rendered and defaults to sign in page
        const currentUrl = page.url();
        expect(currentUrl).toBe('http://localhost:3000/login');
        // wait for the page to stop loading
        await page.waitForSelector('text=Loading...', { hidden: true });

        // look through all elements for matching text
        const count = await countElementsWithText(page, "Sign In");

        expect(count).toBe(4); // tab, header, description, button
    });

    it('invalid user should receive error', async () => {
        await page.goto('http://localhost:3000/login');
        // wait for the page to stop loading
        await page.waitForSelector('text=Loading...', { hidden: true });

        const usernameInput = await page.$('input[placeholder="Email / Username"]');
        const passwordInput = await page.$('#password');

        await usernameInput.type('fake');
        await passwordInput.type('password');
        await page.$$eval('.form-group button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Sign In').click();
        });

        // expect to stay on login with error (will time out if the sign-in-feedback element does not appear)
        await page.waitForSelector('#sign-in-feedback');
        const currentUrl = page.url();
        expect(currentUrl).toBe('http://localhost:3000/login');
    });
});