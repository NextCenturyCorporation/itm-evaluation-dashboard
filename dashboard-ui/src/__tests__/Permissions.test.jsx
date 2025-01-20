import { renderApp } from "../__mocks__/renderMock";
import { screen, waitFor } from '@testing-library/react';

const mockUser = {
    id: '12345',
    username: 'testuser',
    emails: [{ address: 'testuser@example.com', verified: true }],
    admin: true,
    evaluator: true,
    experimenter: true,
    adeptUser: true,
    approved: true,
    rejected: false
};

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
            getUser: jest.fn().mockResolvedValue(mockUser),
        };
    });
});

jest.mock('@accounts/client-password', () => {
    return {
        AccountsClientPassword: jest.fn().mockImplementation(() => {
            return {
                createUser: jest.fn().mockResolvedValue(mockUser),
                login: jest.fn().mockResolvedValue({ user: mockUser }),
            };
        }),
    };
});


xdescribe('Route Redirection and Access Control Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('test that non-admin cannot access anything', async () => {
        await renderApp('/');

        // console.log('hello', screen.debug(screen.getAllByText('')[0], 100000));
        console.log(document.html);

        // await waitFor(() => screen.queryByText(/Thank you for your interest/i));
        // expect(screen.queryByText(/Thank you for your interest/i)).toBeInTheDocument();

    });
    // const history = createMemoryHistory();
    // history.push('/results');
    // await renderApp(history);
    // // await waitFor(() => {
    // //     expect(history.location.pathname).toBe('/');
    // // });
    // history.push('/remote-text-survey');
    // await renderApp(history);
    // // await waitFor(() => {
    // //     expect(history.location.pathname).toBe('/remote-text-survey');
    // // });

    // // expect(screen.queryByText(/Thank you for your interest/i)).toBeInTheDocument();
    // await waitFor(() => {
    //     expect(screen.queryByText(/Welcome to the ITM Text Scenario experiment. Thank you for your participation./i)).toBeInTheDocument();
    // });

    // expect(screen.queryByText(/Program Questions/i)).not.toBeInTheDocument();
    // history.push('/adm-results');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/adm-probe-responses');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/humanSimParticipant');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/scenarios');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/participantTextTester');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/admin');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/participant-progress-table');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/pid-lookup');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/survey');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/survey-results');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/review-text-based');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/review-delegation');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/text-based');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/text-based-results');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/humanProbeData');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/human-results');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/research-results/rq1');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/research-results/rq2');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/research-results/rq3');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/research-results/exploratory-analysis');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/randomlink');
    // await renderApp(history);
    // expect(history.location.pathname).toBe('/');
    // history.push('/remote-text-survey');
    // await renderApp(history);
    // await waitFor(() => {
    //         expect(history.location.pathname).toBe('/remote-text-survey');
    //     });
    // expect(history.location.pathname).toBe('/remote-text-survey');
    // });
});