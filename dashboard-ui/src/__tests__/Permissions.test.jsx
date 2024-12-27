import React from 'react';
import { render, screen } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { ApolloProvider } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { App } from '../components/App';

// Create a mock Apollo Client instance
const mockApolloClient = new ApolloClient({
    link: "https://mock-api/graphql",  // This can be any dummy endpoint
    cache: new InMemoryCache(),      // Use an in-memory cache for tests
});

test('renders app successfully', () => {
    const history = createMemoryHistory();
    history.push('/');

    render(
        <ApolloProvider client={mockApolloClient}>
            <Router history={history}>
                <App client={mockApolloClient} />
            </Router>
        </ApolloProvider>
    );

    // Now you can test components that rely on routing
    const element = screen.getByText(/loading/i);
    expect(element).toBeInTheDocument();
});