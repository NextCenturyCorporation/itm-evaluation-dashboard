import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../__mocks__/renderWithMock';

jest.unmock('@accounts/client');
jest.unmock('@accounts/graphql-client');
jest.unmock('@accounts/client-password');

describe('Test render and bad login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('renders app successfully', async () => {
        await renderApp();

        // Test that the login page is rendered and defaults to sign in page
        expect(window.location.pathname).toBe('/login');
        const elements = screen.queryAllByText(/Sign In/i);
        expect(elements.length).toBe(4); // tab, header, description, button
    });

    it('test bad login', async () => {
        await renderApp();

        const emailInput = screen.getByPlaceholderText('Email / Username');
        const passwordInput = document.getElementById('password');
        userEvent.type(emailInput, 'fake');
        userEvent.type(passwordInput, 'password');
        const btn = screen.getByRole('button', { name: /Sign In/i });
        userEvent.click(btn);
        // expect to stay on login with error
        await waitFor(() => {
            expect(screen.queryByText(/Error logging in/i)).toBeInTheDocument();
        });
        expect(window.location.pathname).toBe('/login');
    });
});