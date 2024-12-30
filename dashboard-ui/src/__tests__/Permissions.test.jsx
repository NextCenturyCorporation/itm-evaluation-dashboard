import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { MockedProvider } from '@apollo/react-testing';
import { App } from '../components/App';
import userEvent from '@testing-library/user-event';
import { homepageMocks } from '../__mocks__/homepageMocks'; 

const renderApp = async () => {
    const history = createMemoryHistory();
    history.push('/');

    render(
        <MockedProvider mocks={homepageMocks} addTypename={false}>
            <Router history={history}>
                <App />
            </Router>
        </MockedProvider>
    );

    // Wait for the loading state to be replaced with actual data
    await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
}

test('renders app successfully', async () => {
    await renderApp();

    // Test that the login page is rendered and defaults to sign in page
    expect(window.location.pathname).toBe('/login');
    const elements = screen.queryAllByText(/Sign In/i);
    expect(elements.length).toBe(4); // tab, header, description, button
});

test('test bad login', async () => {
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

test('test admin login', async () => {
    await renderApp();

    const emailInput = screen.getByPlaceholderText('Email / Username');
    const passwordInput = document.getElementById('password');
    userEvent.type(emailInput, 'admin');
    userEvent.type(passwordInput, 'password');
    const btn = screen.getByRole('button', { name: /Sign In/i });
    userEvent.click(btn);
    // expect to log in successfully
    await waitFor(() => {
        expect(window.location.pathname).toBe('/');
    });

});