import { AccountsClient } from '@accounts/client';
import { AccountsClientPassword } from '@accounts/client-password';
import GraphQLClient from '@accounts/graphql-client';
import { ApolloClient } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
let { API_URL } = require('./config');
// setup for testing
if (Object.keys(API_URL).length === 0 && API_URL.constructor === Object) {
  API_URL = `http://localhost:${process.env.REACT_APP_TESTING == 'false' ? 9100 : 4000}/api`;
}

import gql from 'graphql-tag';

const httpLink = createHttpLink({
  uri: API_URL
});

const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache()
});

const accountsGraphQL = new GraphQLClient({
  graphQLClient: apolloClient,
  userFieldsFragment: gql`
    fragment userFields on User {
      id
      emails {
        address
        verified
      }
      username
      admin
      evaluator
      experimenter
      adeptUser
      approved
      rejected
    }
  `,
});

const accountsClient = new AccountsClient({}, accountsGraphQL);
const accountsPassword = new AccountsClientPassword(accountsClient);

export { accountsClient, accountsGraphQL, accountsPassword, apolloClient };