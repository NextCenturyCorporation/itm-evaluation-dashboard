import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import {App} from "./components/App";
import store from './store/store';
import { ErrorBoundary } from "./components/ErrorHandling/ErrorBoundaries";
import {ApolloProvider} from 'react-apollo';
import {apolloClient} from './services/accountsService';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
 
    <Provider store={store}>
    <ApolloProvider client={apolloClient}>
        <ErrorBoundary>
          <App client={apolloClient} />
        </ErrorBoundary>
    </ApolloProvider>
    </Provider>
    
  );