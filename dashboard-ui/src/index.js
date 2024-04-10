import React from "react";
import ReactDOM from "react-dom/client";
import {App} from "./components/App";

import {ApolloProvider} from 'react-apollo';
import {apolloClient} from './services/accountsService';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ApolloProvider client={apolloClient}><App client={apolloClient} /></ApolloProvider>);