/**
 * @jest-environment puppeteer
 */

// import { renderApp } from "../__mocks__/renderMock";
import { screen, waitFor } from '@testing-library/react';

const adminUser = {
    id: '12345',
    username: 'adminuser',
    emails: [{ address: 'admin@example.com', verified: true }],
    admin: true,
    evaluator: true,
    experimenter: true,
    adeptUser: true,
    approved: true,
    rejected: false
};

const nonAdminUser = {
    id: '67890',
    username: 'regularuser',
    emails: [{ address: 'user@example.com', verified: true }],
    admin: false,
    evaluator: false,
    experimenter: false,
    adeptUser: true,
    approved: true,
    rejected: false
};

let currentMockUser = adminUser;

jest.mock('@accounts/client', () => {
    return {
        AccountsClient: jest.fn().mockImplementation(() => {
            return {
                refreshSession: jest.fn().mockResolvedValue({ accessToken: 'dummyToken' }),
            };
        }),
    };
});

jest.mock('@accounts/graphql-client', () => {
    return jest.fn().mockImplementation(() => {
        return {
            getUser: jest.fn().mockResolvedValue(currentMockUser),
        };
    });
});

jest.mock('@accounts/client-password', () => {
    return {
        AccountsClientPassword: jest.fn().mockImplementation(() => {
            return {
                createUser: jest.fn().mockResolvedValue(currentMockUser),
                login: jest.fn().mockResolvedValue({ user: currentMockUser }),
            };
        }),
    };
});

async function testRouteRedirection(route, expectedRedirect = '/login') {
    await page.goto(`http://localhost:3000${route}`);
    const currentUrl = await page.url();
    expect(currentUrl).toBe(`http://localhost:3000${expectedRedirect}`);
}

describe('Route Redirection and Access Control Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('test that non-admin cannot access anything', async () => {
        // await renderApp('/');
        await page.goto('http://localhost:3000');

        await page.waitForSelector('text/Sign In'); // Jest-puppeteer specific selector for text

        // Retrieve the element and assert its presence
        const loginText = await page.$eval('body', (body) => {
            return body.textContent.includes('Sign in');
        });

        expect(loginText).toBe(true);

    });
    it('Test unsigned in user can access adept survey entry point', async () => {
        await page.goto('http://localhost:3000/remote-text-survey?adeptQualtrix=true');
        // await page.waitForSelector('.text-instructions');
        const currentUrl = await page.url();

        // Assert the URL
        expect(currentUrl).toBe('http://localhost:3000/remote-text-survey?adeptQualtrix=true');
    });
    const routes = [
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
        '/randomlink',
        '/survey',
        '/review-text-based',
        '/review-delegation',
        '/survey-results',
        '/text-based-results',
        '/admin',
        '/random-link'
    ];
    routes.forEach(route => {
        it(`redirects ${route} to login when not authenticated`, async () => {
            await testRouteRedirection(route);
        });
    });

});