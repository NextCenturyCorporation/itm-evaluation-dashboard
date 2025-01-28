import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import unfetch from 'unfetch';
const mongoose = require('mongoose');
import { ApolloServer } from 'apollo-server';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { typeDefs, resolvers } from '../../node-graphql/server.schema.js';
import { ParticipantLog, SurveyResults, SurveyVersion, UserScenarioResults } from './__mocks__/mockDbSchema.js';
import { surveyResultMock, userScenarioResultMock } from './__mocks__/mockData.js';

global.fetch = unfetch;
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');

jest.mock('@accounts/graphql-api', () => {
    return {
        AccountsModule: {
            forRoot: jest.fn(() => ({
                typeDefs: `
                    type Email {
                        address: String
                        verified: Boolean
                    }

                    type Token {
                        refreshToken: String
                        accessToken: String
                    }

                    type LoginResult {
                        sessionId: String
                        tokens: Token
                        user: User
                    }

                    type User {
                        id: ID!
                        username: String
                        emails: [Email]
                        userId: String
                        loginResult: LoginResult
                        deactivated: Boolean
                    }

                    input CreateUserInput {
                        username: String!
                        email: String!
                        password: String!
                    }

                    input UserInput {
                        email: String
                        username: String
                    }

                    input LoginUserPasswordService {
                        user: UserInput
                        password: String
                    }

                    input AuthenticateParamsInput {
                        user: UserInput
                        password: String!
                    }


                    type AuthPayload {
                        tokens: Token
                        user: User
                        sessionId: String
                    }

                    type Mutation {
                        createUser(user: CreateUserInput!): User
                        authenticate(params: AuthenticateParamsInput!, serviceName: String): AuthPayload
                        refreshTokens(accessToken: String, refreshToken: String): AuthPayload
                        logout: Boolean
                    }

                    type Query {
                        getUser: User
                    }
                `,
                resolvers: {
                    Mutation: {
                        authenticate: jest.fn((parent, { params, serviceName }) => {
                            if (params.password != 'secretPassword123') {
                                return null;
                            }
                            return {
                                "sessionId": "67991d239acd0b5980ffbf69",
                                "tokens": {
                                    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MzgwODc3MTUsImV4cCI6MTczODY5MjUxNX0.CNOtRGTcSSSOxMkEGKS5gRUosdzm2XjHdmBEnrcMwAM",
                                    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InRva2VuIjoiYTljMTBkYjJhOTMxN2RmZDA1NjM5MDIwYTc2N2Y5ZDYyNWJjZmFmM2Q3NjhmYTk0NGEzMmM1N2YxYWI5MjNmZGU0ZGNkZTM1NTlmMmVkMDczMzYyYTEiLCJpc0ltcGVyc29uYXRlZCI6ZmFsc2UsInVzZXJJZCI6IjY3OTkxZDIzOWFjZDBiMWI5NGZmYmY2NCJ9LCJpYXQiOjE3MzgwODc3MTUsImV4cCI6MTczODA5MzExNX0.w1x-lWGwqW2hVRNwTl3sQyaxqeyZsJJirn_qkT04ljo",
                                },
                                "user": {
                                    "id": "67991d239acd0b1b94ffbf64",
                                    "emails": [
                                        {
                                            "address": params.user.email,
                                            "verified": false,
                                        }
                                    ],
                                    "username": "tester1",
                                    "admin": params.user.email == 'admin@123.com' || params.user.username == 'admin',
                                    "evaluator": null,
                                    "experimenter": null,
                                    "adeptUser": null,
                                    "approved": params.user.email == 'admin@123.com' || params.user.username == 'admin',
                                    "rejected": null,
                                },
                            }
                        }),
                        createUser: jest.fn((parent, { user }) => {
                            return {
                                userId: null,
                                loginResult: null
                            };
                        }),
                        refreshTokens: jest.fn((parent, { accessToken, refreshToken }) => {
                            return {
                                "sessionId": "67991d239acd0b5980ffbf69",
                                "tokens": {
                                    "refreshToken": refreshToken,
                                    "accessToken": accessToken,
                                },
                            };
                        }),
                        logout: jest.fn(() => {
                            return true;
                        })
                    }
                }
            })),
        }
    };
});



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
        // mongoose.set('debug', true);

        const surveyResults = new SurveyResults(surveyResultMock);

        await surveyResults.save();

        // Insert the mock surveyVersion data
        const surveyVersion = new SurveyVersion({
            version: '5',
        });

        await surveyVersion.save();

        const participantLog = new ParticipantLog({
            "Type": "Mil",
            "ParticipantID": 202409101,
            "Text-1": "AD-1",
            "Text-2": "ST-1",
            "Sim-1": "AD-2",
            "Sim-2": "ST-2",
            "Del-1": "AD-3",
            "Del-2": "ST-3",
            "ADMOrder": 1,
            "claimed": true,
            "simEntryCount": 4,
            "surveyEntryCount": 1,
            "textEntryCount": 5,
            "hashedEmail": "595c55a027391bd9e55844e769594dd102002f9e846704568261ddbeabc19662"
        });

        await participantLog.save()

        const userScenarioResults = new UserScenarioResults(userScenarioResultMock);

        await userScenarioResults.save();

        // Mock AccountsModule and merge typeDefs and resolvers
        const { AccountsModule } = require('@accounts/graphql-api');
        const accountsGraphQL = AccountsModule.forRoot();

        const mergedTypeDefs = mergeTypeDefs([typeDefs, accountsGraphQL.typeDefs]);
        const mergedResolvers = mergeResolvers([resolvers, accountsGraphQL.resolvers]);

        graphqlServer = new ApolloServer({
            typeDefs: mergedTypeDefs,
            resolvers: mergedResolvers,
            context: () => ({
                db: mongoose.connection.db, // Inject the test DB connection
            }),
        });

        // Start the server on port 4000
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
