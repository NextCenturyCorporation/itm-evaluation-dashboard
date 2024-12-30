import { renderApp } from "../__mocks__/renderWithMock";
import { screen } from '@testing-library/react';

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
            getUser: jest.fn().mockResolvedValue({
                id: '12345',
                username: 'testuser',
                emails: [{ address: 'testuser@example.com', verified: true }],
                admin: false,
                evaluator: false,
                experimenter: false,
                adeptUser: false,
            }),
        };
    });
});

jest.mock('@accounts/client-password', () => {
    return {
        AccountsClientPassword: jest.fn().mockImplementation(() => {
            return {
                createUser: jest.fn().mockResolvedValue({ _id: '12345', username: 'testuser', emails: ['testuser@example.com'] }),
                login: jest.fn().mockResolvedValue({
                    user: { _id: '12345', username: 'testuser', emails: ['testuser@example.com'] },
                }),
            };
        }),
    };
});


describe('With account mocks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('test that non-admin cannot access anything', async () => {
        const history = await renderApp();
        expect(history.location.pathname).toBe('/');
        expect(screen.queryByText(/Thank you for your interest/i)).toBeInTheDocument();
        expect(screen.queryByText(/Program Questions/i)).not.toBeInTheDocument();
        history.push('/results');
        expect(history.location.pathname).toBe('/');
        history.push('/adm-results');
        expect(history.location.pathname).toBe('/');
        history.push('/adm-probe-responses');
        expect(history.location.pathname).toBe('/');
        history.push('/humanSimParticipant');
        expect(history.location.pathname).toBe('/');
        history.push('/scenarios');
        expect(history.location.pathname).toBe('/');
        history.push('/participantTextTester');
        expect(history.location.pathname).toBe('/');
        history.push('/admin');
        expect(history.location.pathname).toBe('/');
        history.push('/participant-progress-table');
        expect(history.location.pathname).toBe('/');
        history.push('/pid-lookup');
        expect(history.location.pathname).toBe('/');
        history.push('/survey');
        expect(history.location.pathname).toBe('/');
        history.push('/survey-results');
        expect(history.location.pathname).toBe('/');
        history.push('/review-text-based');
        expect(history.location.pathname).toBe('/');
        history.push('/review-delegation');
        expect(history.location.pathname).toBe('/');
        history.push('/text-based');
        expect(history.location.pathname).toBe('/');
        history.push('/text-based-results');
        expect(history.location.pathname).toBe('/');
        history.push('/humanProbeData');
        expect(history.location.pathname).toBe('/');
        history.push('/human-results');
        expect(history.location.pathname).toBe('/');
        history.push('/dre-results/rq1');
        expect(history.location.pathname).toBe('/');
        history.push('/dre-results/rq2');
        expect(history.location.pathname).toBe('/');
        history.push('/dre-results/rq3');
        expect(history.location.pathname).toBe('/');
        history.push('/dre-results/exploratory-analysis');
        expect(history.location.pathname).toBe('/');
        history.push('/randomlink');
        expect(history.location.pathname).toBe('/');
        history.push('/remote-text-survey');
        expect(history.location.pathname).toBe('/remote-text-survey');
    });
});