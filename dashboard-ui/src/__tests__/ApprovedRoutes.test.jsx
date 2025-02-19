/**
 * @jest-environment puppeteer
 */
import { FOOTER_TEXT, loginAdeptUser, loginAdmin, loginBasicApprovedUser, loginEvaluator, loginExperimenter, testRouteRedirection } from "../__mocks__/testUtils";


function runAllowedRoutesTests(isAdmin = false, isEvaluator = false, isExperimenter = false, isAdeptUser = false) {
    let allowedRoutes = [
        '/',
        '/adm-results',
        '/results',
        '/adm-probe-responses',
        '/humanSimParticipant',
        '/scenarios',
        '/humanProbeData',
        '/human-results',
        '/research-results/rq1',
        '/research-results/rq2',
        '/research-results/rq3',
        '/research-results/exploratory-analysis',
        '/survey', // will need new browser page after this test!!
        '/review-text-based',
        '/review-delegation',
        '/survey-results',
        '/text-based-results',
        '/myaccount',
        '/participant-progress-table',
    ];
    let unallowedRoutes = [
        '/random-link'
    ];
    if (isAdmin) {
        // admins can access all pages
        allowedRoutes.push(...['/admin', '/pid-lookup', '/participantTextTester']);
    }
    else if (isExperimenter) {
        // experimenters can access /pid-lookup and /participantTextTester, but not /admin
        allowedRoutes.push(...['/pid-lookup', '/participantTextTester']); 
        unallowedRoutes.push('/admin');
    }
    else if (isEvaluator || isAdeptUser) {
        // evaluators and AdeptUsers cannot access /admin, /pid-lookup, or /participantTextTester
        unallowedRoutes.push(...['/admin', '/pid-lookup', '/participantTextTester']); 
    }
    else {
        // users with no elevation cannot access any routes
        unallowedRoutes = [...allowedRoutes, '/admin', '/pid-lookup', '/random-link', '/participantTextTester'].filter((x) => x != '/myaccount'); 
        allowedRoutes = ['/', '/myaccount'];

    }
    allowedRoutes.forEach(route => {
        it(`${route} should not redirect`, async () => {
            await testRouteRedirection(route, route);
            if (route == '/survey') {
                page = await browser.newPage();
            }
        });
    });
    unallowedRoutes.forEach(route => {
        it(`redirects ${route} to home when user permissions are not elevated`, async () => {
            await testRouteRedirection(route, '/');
        });
    });
}

describe('Route Redirection and Access Control Tests for admin', () => {
    // log in as admin
    beforeAll(async () => {
        await loginAdmin(page);
    }, 30000);

    runAllowedRoutesTests(true);
    it('Administrators should not see extra headers on progress table', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participant-progress-table`);
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('text/Participant Progress', { timeout: 500 });
        await page.waitForSelector('text/Prolific ID', { timeout: 500 });
        await page.waitForSelector('text/Contact ID', { timeout: 500 });
        await page.waitForSelector('text/Survey Link', { timeout: 500 });
    });
});

describe('Route Redirection and Access Control Tests for evaluators', () => {
    // log in as evaluator
    beforeAll(async () => {
        await loginEvaluator(page);
    });

    runAllowedRoutesTests(false, true);
    it('Evaluators should not see extra headers on progress table', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participant-progress-table`);
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('text/Participant Progress', { timeout: 500 });
        await page.waitForSelector('text/Participant ID', { timeout: 500 });
        const prolificIdExists = await page.evaluate(() => {
            return document.body.innerText.includes('Prolific ID');
        });
        expect(prolificIdExists).toBe(false);

        const contactIdExists = await page.evaluate(() => {
            return document.body.innerText.includes('Contact ID');
        });
        expect(contactIdExists).toBe(false);

        const surveyLinkExists = await page.evaluate(() => {
            return document.body.innerText.includes('Survey Link');
        });
        expect(surveyLinkExists).toBe(false);
    });
});

describe('Route Redirection and Access Control Tests for experimenters', () => {
    // log in as experimenter
    beforeAll(async () => {
        await loginExperimenter(page);
    });

    runAllowedRoutesTests(false, false, true);
    it('Experimenters should not see extra headers on progress table', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participant-progress-table`);
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('text/Participant Progress', { timeout: 500 });
        await page.waitForSelector('text/Participant ID', { timeout: 500 });
        const prolificIdExists = await page.evaluate(() => {
            return document.body.innerText.includes('Prolific ID');
        });
        expect(prolificIdExists).toBe(false);

        const contactIdExists = await page.evaluate(() => {
            return document.body.innerText.includes('Contact ID');
        });
        expect(contactIdExists).toBe(false);

        const surveyLinkExists = await page.evaluate(() => {
            return document.body.innerText.includes('Survey Link');
        });
        expect(surveyLinkExists).toBe(false);
    });
});

describe('Route Redirection and Access Control Tests for adeptUsers', () => {
    // log in as experimenter
    beforeAll(async () => {
        await loginAdeptUser(page);
    });

    runAllowedRoutesTests(false, false, false, true);
    it('ADEPT users should see extra headers on progress table', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participant-progress-table`);
        await page.waitForSelector(FOOTER_TEXT);
        await page.waitForSelector('text/Participant Progress', { timeout: 500 });
        await page.waitForSelector('text/Prolific ID', { timeout: 500 });
        await page.waitForSelector('text/Contact ID', { timeout: 500 });
        await page.waitForSelector('text/Survey Link', { timeout: 500 });
    });
});

describe('Route Redirection and Access Control Tests for approved users with no elevation', () => {
    // log in as experimenter
    beforeAll(async () => {
        await loginBasicApprovedUser(page);
    });

    runAllowedRoutesTests(false, false, false, false);
});