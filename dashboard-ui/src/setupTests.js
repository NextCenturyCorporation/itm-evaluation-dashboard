// Import dependencies after mocking them to ensure mocks are applied
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import unfetch from 'unfetch';
const mongoose = require('mongoose');
import { ApolloServer } from 'apollo-server';
import { MongoMemoryServer } from 'mongodb-memory-server';  // Ensure this is imported correctly
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';  // Required for merging schemas
import { typeDefs, resolvers } from '../../node-graphql/server.schema.js';
import { SurveyVersion } from './__mocks__/mockDbSchema.js';

// Mock global fetch and other browser-specific APIs
global.fetch = unfetch;
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');

// Mocking the @accounts/graphql-api module
jest.mock('@accounts/graphql-api', () => {
    return {
        AccountsModule: {
            forRoot: jest.fn(() => ({
                typeDefs: `
                    type User {
                        id: ID!
                        username: String!
                        email: String!
                    }

                    input CreateUserInput {
                        username: String!
                        email: String!
                        password: String!
                    }
                `,
                resolvers: {},
            })),
        },
    };
});

// Setup MongoDB in-memory server and GraphQL server
let mongoServer;
let graphqlServer;

beforeAll(async () => {
    try {
        // Set up MongoDB in-memory server
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        console.log(uri);

        // Connect to the in-memory MongoDB
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        mongoose.set('debug', true);

        // Insert the mock surveyVersion data
        const surveyVersion = new SurveyVersion({
            version: '5',
        });

        await surveyVersion.save();

        // Mock AccountsModule and merge typeDefs and resolvers
        const { AccountsModule } = require('@accounts/graphql-api');
        const accountsGraphQL = AccountsModule.forRoot();

        // Merge typeDefs and resolvers from accounts with your own
        const mergedTypeDefs = mergeTypeDefs([typeDefs, accountsGraphQL.typeDefs]);
        const mergedResolvers = mergeResolvers([resolvers, accountsGraphQL.resolvers]);

        graphqlServer = new ApolloServer({
            typeDefs: mergedTypeDefs,
            resolvers: mergedResolvers,
            context: () => ({
                db: mongoose.connection.db, // Inject the test DB connection
            }),
        });

        // Start the server on port 4000 (or any available port)
        await graphqlServer.listen({ port: 4000 });
    } catch (error) {
        console.error("Error in beforeAll:", error);
        throw error;
    }
});

afterAll(async () => {
    try {
        // Clean up: Disconnect from DB and stop the GraphQL server
        await mongoose.disconnect();
        await mongoServer.stop();
        await graphqlServer.stop();
    } catch (error) {
        console.error("Error in afterAll:", error);
    }
});
