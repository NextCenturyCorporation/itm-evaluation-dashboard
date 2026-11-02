const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const { makeExecutableSchema } = require('../../node-graphql/node_modules/@graphql-tools/schema');
const { graphql } = require('../../node-graphql/node_modules/graphql');
const jwt = require('../../node-graphql/node_modules/jsonwebtoken')
const { typeDefs, resolvers } = require('../../node-graphql/server.schema');
const { verifyParticipantToken } = require('../../node-graphql/participantAuth')
jest.mock('../../node-graphql/account-configs', () => ({ TOKEN_SECRET: 'participant-tests-only' }), { virtual: true });

const schema = makeExecutableSchema({ typeDefs: [typeDefs, 'type User { id: ID } input CreateUserInput { username: String }'], resolvers });
let mongo, client, db;

const staff = { currentUser: { admin: true, approved: true } }
const ADD = 'mutation($d: JSON) { addNewParticipantToLog(participantData: $d) }'
const READ = 'query($pid: String!) { getParticipantByPid(pid: $pid) }'
const UPDATE = 'mutation($pid: String) { updateParticipantLog(pid: $pid, updates: { claimed: true }) }'
const SAVE = 'mutation($r: JSON) { upsertScenarioResult(result: $r) }'
const BULK = '{ getAllScenarioResultsByEvalNumber(evalNumber: 17) }'

const asParticipant = token => ({ participant: verifyParticipantToken(token)})
const run = (source, variableValues, context = {}) => graphql({ schema, source, variableValues, contextValue: {db, ...context}})
const refused = result => result.errors?.[0]?.message.startsWith('Login required')
const pidsIn = result => result.data.getAllScenarioResultsByEval.map(row => row.participantID)

async function addParticipant(participantData = {}) {
    const result = await run(ADD, { d: { evalNum: 17, ...participantData }})
    const added = result.data.addNewParticipantToLog
    return { pid: String(added.ops[0].ParticipantID), token: added.participantToken }
}

beforeAll(async () => {
    mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14' }, instance: { storageEngine: 'wiredTiger' } });
    client = await MongoClient.connect(mongo.getUri(), { useUnifiedTopology: true });
    db = client.db('participant-auth-tests');
});
beforeEach(async () => { 
    await db.dropDatabase(); 
    await db.collection('surveyVersion').insertOne({ lowPid: 100, highPid: 200 })
});
afterAll(async () => { if (client) await client.close(); if (mongo) await mongo.stop(); });

test('a participant token only reaches its own PID', async () => {
    const a = await addParticipant()
    const b = await addParticipant()
    const asA = asParticipant(a.token)
    await run(SAVE, { r: {participantID: a.pid, scenario_id: 'check-A', evalNumber: 17 } }, asA)
    await run(SAVE, { r: {participantID: a.pid, scenario_id: 'check-B', evalNumber: 17 } }, asParticipant(b.token))
    
    expect((await run(READ, { pid: a.pid }, asA)).errors).toBeUndefined()
    expect(pidsIn(await run(BULK, {}, staff))).toEqual(expect.arrayContaining([a.pid, b.pid]))

    expect(refused(await run(READ, { pid: b.pid }, asA))).toBe(true)
    expect(refused(await run(UPDATE, { pid: b.pid }, asA))).toBe(true)
    expect(pidsIn(await run(BULK, {}, asA))).toEqual([a.pid])
})

test('a token signed with a guessed secret is refused', async () => {
    const a = await addParticipant()
    const forged = jwt.sign({ pid: a.pid }, 'guessed-secret')
    expect(refused(await run(READ, { pid: a.pid }, asParticipant(forged)))).toBe(true)
})

test('the server picks the PID even when the client asks for one', async () => {
    const b = await addParticipant()
    const c = await addParticipant({ ParticipantID: Number(b.pid) })
    expect(c.pid).not.toBe(b.pid)
    expect(verifyParticipantToken(c.token).pid).toBe(c.pid)
})