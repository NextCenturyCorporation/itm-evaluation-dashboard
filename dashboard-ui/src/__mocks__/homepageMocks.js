import gql from "graphql-tag";

const GET_SURVEY_VERSION = gql`
  query GetSurveyVersion {
    getCurrentSurveyVersion
  }
`;

const GET_PARTICIPANT_LOG = gql`
  query GetParticipantLog {
    getParticipantLog
  }`;

const GET_CONFIGS = gql`
  query GetConfigs($includeImageUrls: Boolean!) {
    getAllSurveyConfigs
    getAllImageUrls @include(if: $includeImageUrls)
    getAllTextBasedConfigs
    getAllTextBasedImages
  }`;


export const homepageMocks = [
    {
        request: {
            query: GET_CONFIGS,
            variables: { includeImageUrls: false }
        },
        result: {
            data: {
                getAllSurveyConfigs: [],
                getAllImageUrls: [],
                getAllTextBasedConfigs: [],
                getAllTextBasedImages: []
            }
        },
    },
    {
        request: {
            query: GET_SURVEY_VERSION
        },
        result: {
            data: {
                getCurrentSurveyVersion: "5"
            }
        }
    },
    {
        request: {
            query: GET_PARTICIPANT_LOG
        },
        result: {
            data: {
                getParticipantLog: []
            }
        }
    }
];