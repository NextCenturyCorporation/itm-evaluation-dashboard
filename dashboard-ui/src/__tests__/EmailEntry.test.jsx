/**
 * @jest-environment puppeteer
 */

import { countElementsWithText, createAccount, login, logout } from "../__mocks__/testUtils";

let firstPid = 0;

describe('Test email-entry text scenarios', () => {
    beforeEach(async () => {
        page = await browser.newPage();
    })
    it('/participantText should only have email-entry option', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('text=Text Scenario Login');
        const currentUrl = page.url();
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/participantText`);

        let count = await countElementsWithText(page, "Sign In");
        expect(count).toBe(0);

        count = await countElementsWithText(page, "Create Account");
        expect(count).toBe(0);

        count = await countElementsWithText(page, "Text Scenario Login");
        expect(count).toBeGreaterThan(0);
    });

    it('/participantText should error on non-duplicate email', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('test@123.com');
        await email2.type('test@12.com');
        // will time out if this element is not found
        await page.waitForSelector('text=Email Mismatch');
    });

    it('/participantText should not error on matching email (case insensitive)', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('test@123.com');
        await email2.type('T');
        let count = await countElementsWithText(page, "Email Mismatch");
        expect(count).toBeGreaterThan(0);
        await email2.type('esT@123.com');
        count = await countElementsWithText(page, "Email Mismatch");
        expect(count).toBe(0);
    });

    it('matching emails on /participantText should navigate to /text-based', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('ptextTester@123.com');
        await email2.type('ptextTester@123.com');
        await page.$$eval('.form-group button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Start').click();
        });
        await page.waitForSelector('text/Welcome');
        const currentUrl = page.url();
        firstPid = currentUrl.split('pid=').slice(-1)[0];
        expect(currentUrl).toContain(`${process.env.REACT_APP_TEST_URL}/text-based`);
    }, 10000);

    it('new email entry on /participantText should generate new PID', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('tester1@123.com');
        await email2.type('TESTER1@123.com');
        await page.$$eval('.form-group button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Start').click();
        });
        await page.waitForSelector('text/Welcome');
        const currentUrl = page.url();
        const thisPid = currentUrl.split('pid=').slice(-1)[0];
        expect(currentUrl).toContain(`${process.env.REACT_APP_TEST_URL}/text-based`);
        expect(thisPid).not.toBe(firstPid);
    }, 10000);

    it('duplicate email entry on /participantText should generate duplicate PID', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('ptextTester@123.com');
        await email2.type('PTEXTTESTER@123.com');
        await page.$$eval('.form-group button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Start').click();
        });
        await page.waitForSelector('text/Welcome');
        const currentUrl = page.url();
        const thisPid = currentUrl.split('pid=').slice(-1)[0];
        expect(currentUrl).toContain(`${process.env.REACT_APP_TEST_URL}/text-based`);
        expect(thisPid).toBe(firstPid);
    }, 10000);

    it('PID Lookup should show correct PID for email', async () => {
        await logout(page);
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);
        // try to create admin account in case tests run out of order
        await createAccount(page, 'admin', 'admin@123.com', 'secretPassword123');
        await logout(page);
        // login as admin account
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);
        await login(page, 'admin', 'secretPassword123');
        await page.waitForSelector('text/Program Questions');
        const currentUrl = page.url();
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/`);
        const menu = await page.$('#basic-nav-dropdown');
        await menu.click();
        await page.$$eval('a', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'PID Lookup').click();
        });
        await page.waitForSelector('#emailOnly');
        const emailInput = await page.$('#emailOnly');
        await emailInput.type('pTEXTtester@123.com');
        await page.$$eval('.form-group button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Find PID').click();
        });
        // will time out if it fails
        await page.waitForSelector('text/PID: ' + firstPid.toString());
    }, 8000000);
});