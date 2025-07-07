import { AccountsClient } from '@accounts/client';
import { AccountsClientPassword } from '@accounts/client-password';
import GraphQLClient from '@accounts/graphql-client';
import { ApolloClient } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import gql from 'graphql-tag';
import { isDefined } from '../components/AggregateResults/DataFunctions';
let { API_URL } = require('./config');
if (!isDefined(API_URL))
  API_URL = `http://localhost:${process.env.REACT_APP_TESTING === 'true' ? process.env.REACT_APP_GRAPHQL_TEST_PORT : 9100}/api`;

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
if (process.env.REACT_APP_TESTING === 'true') {
  accountsClient.refreshSession = () => {
    return {
      "tokens": {
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MzgwODc3MTUsImV4cCI6MTczODY5MjUxNX0.CNOtRGTcSSSOxMkEGKS5gRUosdzm2XjHdmBEnrcMwAM",
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InRva2VuIjoiYTljMTBkYjJhOTMxN2RmZDA1NjM5MDIwYTc2N2Y5ZDYyNWJjZmFmM2Q3NjhmYTk0NGEzMmM1N2YxYWI5MjNmZGU0ZGNkZTM1NTlmMmVkMDczMzYyYTEiLCJpc0ltcGVyc29uYXRlZCI6ZmFsc2UsInVzZXJJZCI6IjY3OTkxZDIzOWFjZDBiMWI5NGZmYmY2NCJ9LCJpYXQiOjE3MzgwODc3MTUsImV4cCI6MTczODA5MzExNX0.w1x-lWGwqW2hVRNwTl3sQyaxqeyZsJJirn_qkT04ljo",
      }
    }
  }
}
const accountsPassword = new AccountsClientPassword(accountsClient);

export { accountsClient, accountsGraphQL, accountsPassword, apolloClient };