import gql from 'graphql-tag';
import { apolloClient } from './accountsService';

export const GET_PARTICIPANT_BY_PID = gql`
    query GetParticipantByPid($pid: String!) {
        getParticipantByPid(pid: $pid)
    }
`;

const GET_PARTICIPANT_BY_EMAIL = gql`
    query GetParticipantByEmail($hashedEmail: String!, $evalNumber: Float) {
        getParticipantByEmail(hashedEmail: $hashedEmail, evalNumber: $evalNumber)
    }
`;

const GET_NEXT_PARTICIPANT_ID = gql`
    query GetNextParticipantId { getNextParticipantId }
`;

export async function findParticipantByEmail(hashedEmail, evalNumber) {
    const { data } = await apolloClient.query({
        query: GET_PARTICIPANT_BY_EMAIL,
        variables: { hashedEmail, evalNumber },
        fetchPolicy: 'no-cache'
    });
    return data.getParticipantByEmail;
}

export async function findParticipantByPid(pid) {
    const { data } = await apolloClient.query({
        query: GET_PARTICIPANT_BY_PID, variables: { pid }, fetchPolicy: 'no-cache'
    });
    return data.getParticipantByPid;
}

export async function getNextParticipantId() {
    const { data } = await apolloClient.query({ query: GET_NEXT_PARTICIPANT_ID, fetchPolicy: 'no-cache' });
    return data.getNextParticipantId;
}
