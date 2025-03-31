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

// Create merged schema
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
    introspection: false,
    playground: false,
    plugins: [
        {
            requestDidStart: () => ({
                didResolveOperation({ request, document }) {
                    return processQueryComplexity(schema, complexityMap, request, document);
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