const { ApolloServer } = require('apollo-server');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');
const { AccountsModule } = require('@accounts/graphql-api');
const { accountsServer } = require('./server.mongo');
const { typeDefs, resolvers } = require('./server.schema');
const { dashboardDB } = require('./server.mongo.js');
const { GRAPHQL_PORT } = require('./config');
const { 
    extractComplexityValues, 
    processQueryComplexity 
} = require('./complexityUtil');
const { rateLimit } = require('./rateLimiter');

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

// grab custom complexities from server schema
const complexityMap = extractComplexityValues(schema);

const server = new ApolloServer({
    schema,
    introspection: true,
    playground: true,
    plugins: [
        {
            requestDidStart: async ({ request, context }) => {
                return {
                    didResolveOperation({ request, document }) {
                        try {
                            // check rate limit first
                            const rateLimitInfo = rateLimit(context.req);
                            context.rateLimitInfo = rateLimitInfo;
                            
                            // check complexity if rate limit passes
                            const complexity = processQueryComplexity(
                                schema, 
                                complexityMap, 
                                request, 
                                document
                            );
                            
                            return complexity;
                        } catch (error) {
                            if (error.isRateLimit || error.message.includes('Rate limit exceeded')) {
                                context.isRateLimit = true;
                                context.retryAfter = error.retryAfter;
                            }
                            throw error
                        }
                    },
                    
                    willSendResponse({ response, context }) {
                        // add rate limit info to headers
                        try {
                            if (context.rateLimitInfo) {
                                if (!response.http) response.http = {};
                                if (!response.http.headers) response.http.headers = new Map();
                                
                                response.http.headers.set('X-RateLimit-Limit', context.rateLimitInfo.limit);
                                response.http.headers.set('X-RateLimit-Remaining', context.rateLimitInfo.remaining);
                                response.http.headers.set('X-RateLimit-Reset', context.rateLimitInfo.reset);
                            }

                            if (context.isRateLimit) {
                                response.http = response.http || {};
                                response.http.status = 429;
                                
                                if (context.retryAfter && response.http.headers) {
                                    response.http.headers.set('Retry-After', context.retryAfter);
                                }
                            }
                        } catch (error) {
                            console.error('Error setting rate limit headers:', error);
                        }
                    }
                };
            },
        },
    ],
    context: ({ req }) => {
        return { db: dashboardDB.db, req: req };
    },
    formatError: (error) => {
        console.log(error)
        return error
    }
});

// The `listen` method launches a web server
server.listen(GRAPHQL_PORT).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});