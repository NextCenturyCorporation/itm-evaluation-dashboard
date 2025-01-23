import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import unfetch from 'unfetch';
// const { MongoMemoryServer } = require('mongodb-memory-server');
// const mongoose = require('mongoose');
// const { ApolloServer } = require('apollo-server');
// const { typeDefs, resolvers } = require('../../node-graphql/server.schema.js'); // Your GraphQL schema files

// Mock global fetch and other browser-specific APIs
global.fetch = unfetch;
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');



// let mongoServer;
// let graphqlServer;

// beforeAll(async () => {
//     // Set up MongoDB in-memory server
//     mongoServer = await MongoMemoryServer.create();
//     const uri = mongoServer.getUri();

//     // Connect to the in-memory MongoDB
//     await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//     // Set up GraphQL server
//     graphqlServer = new ApolloServer({
//         typeDefs,
//         resolvers,
//         context: ({ req }) => ({
//             db: mongoose.connection.db, // Inject the test DB connection
//         }),
//     });

//     // Start the server on port 4000 (or any available port)
//     await graphqlServer.listen({ port: 4000 });
// });

// afterAll(async () => {
//     // Clean up: Disconnect from DB and stop the GraphQL server
//     await mongoose.disconnect();
//     await mongoServer.stop();
//     await graphqlServer.stop();
// });

// Mock HTMLCanvasElement.getContext globally (if needed for tests)
// try {
//     global.HTMLCanvasElement.prototype.getContext = jest.fn(() => {
//         return {}; // You can return an empty object or a mock function
//     });
// }
// catch {
//     console.warn(("Could not load HTMLCanvasElement"));
// }
