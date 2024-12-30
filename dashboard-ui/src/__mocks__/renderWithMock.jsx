import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { MockedProvider } from '@apollo/react-testing';
import { App } from '../components/App';
import { homepageMocks } from '../__mocks__/homepageMocks';


export const renderApp = async () => {
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
    return history;
}