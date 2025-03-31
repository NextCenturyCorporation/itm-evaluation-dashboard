const { ApolloServer } = require('apollo-server');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');
const { AccountsModule } = require('@accounts/graphql-api');
const { accountsServer } = require('./server.mongo');
const { typeDefs, resolvers } = require('./server.schema');
const { dashboardDB } = require('./server.mongo.js');
const { GRAPHQL_PORT } = require('./config');
const { getComplexity, simpleEstimator, fieldExtensionsEstimator } = require('graphql-query-complexity');
const { separateOperations } = require('graphql');

// Generate the accounts-js GraphQL module
const accountsGraphQL = AccountsModule.forRoot({ accountsServer });

async function createUniqueIndex() {
    try {
        await dashboardDB.db.collection('participantLog').createIndex(
            { "ParticipantID": 1 },
            { unique: true }
        );
        console.log("Unique index on ParticipantID created successfully.");
    } catch (error) {
        if (error.code !== 85) { // Index already exists
            console.error("Error creating unique index (ParticipantID):", error);
        }
    }
    try {
        await dashboardDB.db.collection('participantLog').createIndex(
            { "hashedEmail": 1 },
            { unique: true }
        );
        console.log("Unique index on hashedEmail created successfully.");
    } catch (error) {
        if (error.code !== 85) { // Index already exists
            console.error("Error creating unique index (hashedEmail):", error);
        }
    }
}

createUniqueIndex().catch(console.error);

// Merge our schema and the accounts-js schema
const schema = makeExecutableSchema({
    typeDefs: mergeTypeDefs([typeDefs, accountsGraphQL.typeDefs]),
    resolvers: mergeResolvers([accountsGraphQL.resolvers, resolvers]),
    schemaDirectives: {
        ...accountsGraphQL.schemaDirectives,
    }
});

const MAX_COMPLEXITY = 150;

const server = new ApolloServer({
    schema,
    introspection: false,
    playground: false,
    plugins: [
        {
            requestDidStart: () => ({
                didResolveOperation({ request, document }) {
                    if (!document) return;
                    
                    try {
                        const operationName = request.operationName;
                        
                        const complexity = getComplexity({
                            schema,
                            query: request.operationName
                                ? separateOperations(document)[request.operationName]
                                : document,
                            variables: request.variables,
                            estimators: [
                                // Use field extensions estimator for schema-defined complexity
                                fieldExtensionsEstimator(),
                                simpleEstimator({ defaultComplexity: 1 }),
                            ],
                        });
                        
                        
                        // Check if the query exceeds complexity threshold and isn't exempt
                        if (complexity > MAX_COMPLEXITY) {
                            console.error(`[Complexity] Operation "${operationName}" blocked - complexity: ${complexity} exceeds threshold: ${MAX_COMPLEXITY}`);
                            throw new Error(
                                `Query complexity of ${complexity} exceeds maximum allowed complexity of ${MAX_COMPLEXITY}. Please simplify your query.`
                            );
                        }
                    } catch (error) {
                        // If it's our complexity error, re-throw it
                        if (error.message.includes("Query complexity")) {
                            throw error;
                        }
                        // Otherwise log the error but don't block the query
                        console.error('Error in complexity analysis:', error);
                    }
                },
            }),
        },
    ],
    context: ({ req }) => {
        return { db: dashboardDB.db, req: req };
    }
});

// The `listen` method launches a web server
server.listen(GRAPHQL_PORT).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});