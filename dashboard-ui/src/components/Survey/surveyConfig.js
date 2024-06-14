import { graphql } from 'graphql';

const GET_SURVEY_CONFIG = gql`
    query GetSurveyConfig {
        getAllSurveyConfigs,
        getAllImageUrls
    }`;

const executeGraphQLQuery = async () => {
    try {
        // Execute the GraphQL query
        const result = await graphql(schema, GET_SURVEY_CONFIG);

        // Return the result
        return result;
    } catch (error) {
        // Handle any errors
        console.error('Error executing GraphQL query:', error);
        return { error: error.message };
    }
    const jsonObj = {};
};

export { executeGraphQLQuery };