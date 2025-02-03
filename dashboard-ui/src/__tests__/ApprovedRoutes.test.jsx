/**
 * @jest-environment puppeteer
 */
import { loginAdeptUser, loginAdmin, loginBasicApprovedUser, loginEvaluator, loginExperimenter, testRouteRedirection } from "../__mocks__/testUtils";


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
        // '/survey', // will need new browser page after this test!!
        '/review-text-based',
        '/review-delegation',
        '/survey-results',
        '/text-based-results',
        '/myaccount',
        '/participant-progress-table',
    ];
    let unallowedRoutes = [
        // '/random-link' // broken functionality!
    ];
    if (isAdmin) {
        // admins can access all pages
        allowedRoutes.push(...['/admin', '/pid-lookup']); // '/participantTextTester'
    }
    else if (isExperimenter) {
        // experimenters can access /pid-lookup and /participantTextTester, but not /admin
        allowedRoutes.push(...['/pid-lookup']); // '/participantTextTester',
        unallowedRoutes.push('/admin');
    }
    else if (isEvaluator || isAdeptUser) {
        // evaluators and AdeptUsers cannot access /admin, /pid-lookup, or /participantTextTester
        unallowedRoutes.push(...['/admin', '/pid-lookup']); // '/participantTextTester'
    }
    else {
        // users with no elevation cannot access any routes
        unallowedRoutes = [...allowedRoutes, '/admin', '/pid-lookup'].filter((x) => x != '/myaccount'); // '/participantTextTester'
        allowedRoutes = ['/', '/myaccount'];

    }
    allowedRoutes.forEach(route => {
        it(`${route} should not redirect`, async () => {
            const res = await testRouteRedirection(route, route);
            if (!res) {
                if (isAdmin)
                    await loginAdmin(page);
                else if (isEvaluator)
                    await loginEvaluator(page);
                else if (isExperimenter)
                    await loginExperimenter(page);
                else if (isAdeptUser)
                    await loginAdeptUser(page);
                await testRouteRedirection(route, route, true);
            }
        });
    });
    unallowedRoutes.forEach(route => {
        it(`redirects ${route} to home when user permissions are not elevated`, async () => {
            const res = await testRouteRedirection(route, '/');
            if (!res) {
                if (isAdmin)
                    await loginAdmin(page);
                else if (isEvaluator)
                    await loginEvaluator(page);
                else if (isExperimenter)
                    await loginExperimenter(page);
                else if (isAdeptUser)
                    await loginAdeptUser(page);
                await testRouteRedirection(route, '/', true);
            }
        });
    });
}

describe('Route Redirection and Access Control Tests for admin', () => {
    // log in as admin
    beforeAll(async () => {
        await loginAdmin(page);
    });

    runAllowedRoutesTests(true);
});

describe('Route Redirection and Access Control Tests for evaluators', () => {
    // log in as evaluator
    beforeAll(async () => {
        await loginEvaluator(page);
    });

    runAllowedRoutesTests(false, true);
});

describe('Route Redirection and Access Control Tests for experimenters', () => {
    // log in as experimenter
    beforeAll(async () => {
        await loginExperimenter(page);
    });

    runAllowedRoutesTests(false, false, true);
});

describe('Route Redirection and Access Control Tests for adeptUsers', () => {
    // log in as experimenter
    beforeAll(async () => {
        await loginAdeptUser(page);
    });

    runAllowedRoutesTests(false, false, false, true);
});

// describe('Route Redirection and Access Control Tests for approved users with no elevation', () => {
//     // log in as experimenter
//     beforeAll(async () => {
//         await loginBasicApprovedUser(page);
//     });

//     runAllowedRoutesTests(false, false, false, false);
// });