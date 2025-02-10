/**
 * @jest-environment puppeteer
 */

import { HOME_TEXT, WAITING_TEXT, createAccount, login, loginAdmin, logout, testRouteRedirection } from "../__mocks__/testUtils";

function runRoutePermissionTests(allowApprovalPage = false) {
    let routes = [
        '/results',
        '/adm-results',
        '/adm-probe-responses',
        '/humanSimParticipant',
        '/scenarios',
        '/humanProbeData',
        '/human-results',
        '/research-results/rq1',
        '/research-results/rq2',
        '/research-results/rq3',
        '/research-results/exploratory-analysis',
        '/survey',
        '/review-text-based',
        '/review-delegation',
        '/survey-results',
        '/text-based-results',
        '/admin',
        '/pid-lookup',
        '/myaccount',
        '/participantTextTester',
        '/participant-progress-table',
        '/',
        '/random-link',
    ];
    if (!allowApprovalPage) {
        routes.push('/awaitingApproval');
    }
    routes.forEach(route => {
        it(`redirects ${route} to ${allowApprovalPage ? '/awaitingApproval' : '/login'} when not authenticated`, async () => {
            await testRouteRedirection(route, allowApprovalPage ? '/awaitingApproval' : '/login');
        });
    });
}

describe('Route Redirection and Access Control Tests for unauthenticated users', () => {
    beforeAll(async () => {
        await logout(page);
        // long wait time for slow startups
    }, 50000);

    it('Test unauthenticated user can access adept survey entry point', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?adeptQualtrix=true`);
        const currentUrl = page.url();

        // Assert the URL
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?adeptQualtrix=true`);
    });

    runRoutePermissionTests(false);
});

describe('Login tests', () => {
    beforeAll(async () => {
        await jestPuppeteer.resetBrowser();
    })

    beforeEach(async () => {
        await jestPuppeteer.resetPage();
        await logout(page);
    });

    it('invalid user should receive error', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);
        // wait for the page to stop loading
        await page.waitForSelector('#password');

        await login(page, 'fake', 'password');

        // expect to stay on login with error (will time out if the sign-in-feedback element does not appear)
        await page.waitForSelector('text/Error logging in');
        const currentUrl = page.url();
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/login`);
    });

    it('new user should be sent to waiting page; return to login should work', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);
        // wait for the page to stop loading
        await page.waitForSelector('#password');
        await createAccount(page, 'TESTer', 'teSter@123.com', 'secretPassword123');

        await page.waitForSelector('text/' + WAITING_TEXT);
        await page.waitForSelector('text/Status: Awaiting Approval', { timeout: 500 });
        let currentUrl = page.url();
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/awaitingApproval`);
        await page.$$eval('button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Return to Login').click();
        });
        await page.waitForSelector('text/Sign In');
        currentUrl = page.url();
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/login`);
    }, 10000);

    it('rejected user should be sent to waiting page; return to login should work', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);
        // wait for the page to stop loading
        await page.waitForSelector('#password');
        await createAccount(page, 'rejected', 'rejected@123.com', 'secretRejectedPassword123');

        await page.waitForSelector('text/' + WAITING_TEXT);
        await page.waitForSelector('text/Status: Account Rejected', { timeout: 500 });
        let currentUrl = page.url();
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/awaitingApproval`);
        await page.$$eval('button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Return to Login').click();
        });
        await page.waitForSelector('text/Sign In');
        currentUrl = page.url();
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/login`);
    }, 10000);

    it('logging out and back in should be functional', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);
        // wait for the page to stop loading
        await page.waitForSelector('#password');

        await login(page, 'tester', 'secretPassword123');

        await page.waitForSelector('text/' + WAITING_TEXT);
        const currentUrl = page.url();
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/awaitingApproval`);
    });

    it('admin should be sent to home page', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);
        // wait for the page to stop loading
        await page.waitForSelector('#password');
        await createAccount(page, 'admin', 'admin@123.com', 'secretAdminPassword123');

        await page.waitForSelector(HOME_TEXT);
        const currentUrl = page.url();
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/`);
    }, 10000);

    it('creating an account with a duplicate email should error', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);
        await page.waitForSelector('#password', { timeout: 1000 });
        await createAccount(page, 'tester1', 'tester@123.com', 'secretPassword123');

        await page.waitForSelector('text/Error creating account', { timeout: 3000 });
        const currentUrl = page.url();

        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/login`);
    }, 10000);

    it('creating an account with a duplicate username should error', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);
        await page.waitForSelector('#password', { timeout: 1000 });
        await createAccount(page, 'tester', 'tester1@123.com', 'secretPassword123');

        await page.waitForSelector('text/Error creating account', { timeout: 3000 });
        const currentUrl = page.url();

        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/login`);
    }, 10000);

});

describe('Route Redirection and Access Control Tests for unapproved users', () => {
    // log in as unauthenticated user
    beforeEach(async () => {
        const pageContent = await page.evaluate(() => document.body.innerText);
        // only logout/login if we have been logged out somehow
        if (!pageContent.includes(WAITING_TEXT)) {
            await logout(page);
            await login(page, 'tester', 'secretPassword123', true);

            await page.waitForSelector('text/' + WAITING_TEXT);
        }
    });

    it('Test unapproved user can access adept survey entry point', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?adeptQualtrix=true`);
        const currentUrl = page.url();

        // Assert the URL
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?adeptQualtrix=true`);
    });
    runRoutePermissionTests(true);
});

describe('Once logged out, no routes should be accessible', () => {
    beforeAll(async () => {
        await logout(page);
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);
        // wait for the page to stop loading
        await page.waitForSelector('#password');
        await loginAdmin(page);
        // log out (not using log out function to ensure that we were logging in as authenticated user)
        const menu = await page.$('#basic-nav-dropdown');
        await menu.click();
        await page.$$eval('a', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Logout').click();
        });
        await page.waitForSelector('text/Sign In');
        const currentUrl = page.url();
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/login`);
    });

    it('Test unauthenticated user can access adept survey entry point', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?adeptQualtrix=true`);
        const currentUrl = page.url();

        // Assert the URL
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?adeptQualtrix=true`);
    });
    runRoutePermissionTests(false);
});