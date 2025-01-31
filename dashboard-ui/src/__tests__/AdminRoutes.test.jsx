/**
 * @jest-environment puppeteer
 */
import { login, logout, testRouteRedirection } from "../__mocks__/testUtils";


function runAllowedRoutesTests(isAdmin = false) {
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
        // '/survey', // will need new browser page after this test!!
        '/review-text-based',
        '/review-delegation',
        '/survey-results',
        '/text-based-results',
        '/myaccount',
        // '/participantTextTester', // broken functionality!
        '/participant-progress-table',
    ];
    let unallowedRoutes = [
        // '/random-link' // broken functionality!
    ];
    if (isAdmin) {
        allowedRoutes.push(...['/admin', '/pid-lookup']);
    }
    else {
        unallowedRoutes.push(...['/admin', '/pid-lookup']);
    }
    allowedRoutes.forEach(route => {
        it(`${route} should not redirect`, async () => {
            await testRouteRedirection(route, route);
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
        await logout(page);
        await login(page, 'admin@123.com', 'secretPassword123', true);
        await page.waitForSelector('text/Program Questions');
    });

    runAllowedRoutesTests(true);
});