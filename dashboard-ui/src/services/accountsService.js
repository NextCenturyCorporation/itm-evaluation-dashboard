import { AccountsClient } from '@accounts/client';
import { AccountsClientPassword } from '@accounts/client-password';
import GraphQLClient from '@accounts/graphql-client';
import { ApolloClient } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import gql from 'graphql-tag';
import { isDefined } from '@mui/x-charts/internals';
let { API_URL } = require('./config');
if (!isDefined(API_URL))
  API_URL = `http://localhost:${process.env.REACT_APP_TESTING == 'true' ? 4000 : 9100}/api`;

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