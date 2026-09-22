const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const { getParticipantProgress } = require('../../node-graphql/participantProgress');
const { participantIdFilter, getParticipantByEmail, getNextParticipantId, getParticipantProgressDetails } = require('../../node-graphql/participantQueries');
const { checkAlignmentStatus } = require('../src/components/Account/progressUtils');
jest.mock('../src/components/TextBasedScenarios/adeptUtils', () => ({}));

let mongo, client, db;
const page = (filter = {}, offset = 0, limit = 50) => getParticipantProgress(db, { filter: { phase: 'Phase 2', ...filter }, offset, limit });
const log = (pid, fields = {}) => ({ ParticipantID: pid, Type: 'Mil', evalNum: 17, ...fields });
const scored = [{ response: [{ target: 0.5 }] }];

beforeAll(async () => {
    mongo = await MongoMemoryServer.create({ binary: { version: '7.0.14' }, instance: { storageEngine: 'wiredTiger' } });
    client = await MongoClient.connect(mongo.getUri(), { useUnifiedTopology: true });
    db = client.db('participant-performance-tests');
});
beforeEach(async () => { await db.dropDatabase(); });
afterAll(async () => { if (client) await client.close(); if (mongo) await mongo.stop(); });

test('email and PID lookups preserve evaluation and legacy ID matching without returning the log', async () => {
    await db.collection('participantLog').insertMany([
        log(100, { hashedEmail: 'email', evalNum: 16, textEntryCount: 2, unrelated: 'hidden' }),
        log(101, { hashedEmail: 'email', evalNum: '17', textEntryCount: 4 }),
        log('00102', { hashedEmail: 'other' })
    ]);
    expect(await getParticipantByEmail(db, 'email', 17)).toEqual({ ParticipantID: 101, evalNum: '17', textEntryCount: 4 });
    expect(await getParticipantByEmail(db, 'email', 19)).toBeNull();
    expect((await getParticipantByEmail(db, 'email')).ParticipantID).toBe(100);
    expect((await db.collection('participantLog').findOne(participantIdFilter('100'))).ParticipantID).toBe(100);
    expect((await db.collection('participantLog').findOne(participantIdFilter('00102'))).ParticipantID).toBe('00102');
    expect(await db.collection('participantLog').findOne(participantIdFilter('00100'))).toBeNull();
});

test('next PID reads a bounded maximum, including numeric strings and empty ranges', async () => {
    await db.collection('surveyVersion').insertOne({ lowPid: 100, highPid: 110 });
    expect(await getNextParticipantId(db)).toBe(100);
    await db.collection('participantLog').insertMany([log(103), log('105'), log('109A'), log(200)]);
    expect(await getNextParticipantId(db)).toBe(106);
    await db.collection('participantLog').insertOne(log(110));
    await expect(getNextParticipantId(db)).rejects.toThrow('range is full');
});

test('pages cover the full result exactly once and return global metadata', async () => {
    await db.collection('participantLog').insertMany(Array.from({ length: 120 }, (_, i) => log(202600000 + i, { Type: i === 119 ? 'Online' : 'Mil' })));
    const first = await page();
    const second = await page({}, 50);
    const third = await page({}, 100);
    expect([first.rows.length, second.rows.length, third.rows.length]).toEqual([50, 50, 20]);
    expect(first.totalCount).toBe(120);
    expect(first.phaseCount).toBe(120);
    expect(first.participantTypes.sort()).toEqual(['Mil', 'Online']);
    const ids = [...first.rows, ...second.rows, ...third.rows].map(row => row.pid);
    expect(new Set(ids).size).toBe(120);
    expect(ids).toEqual([...ids].sort());
    const empty = await page({ evalNumbers: [16] });
    expect(empty.rows).toEqual([]);
    expect(empty.totalCount).toBe(0);
    expect(empty.phaseCount).toBe(120);
    expect(empty.evaluations.map(e => e.evalNumber)).toEqual([17]);
});

test('evaluation, type, search, completion and sorting apply to all rows before paging', async () => {
    await db.collection('participantLog').insertMany(Array.from({ length: 70 }, (_, i) => log(202600000 + i, { evalNum: i < 60 ? 16 : 17, Type: i < 60 ? 'Mil' : 'Online', simEntryCount: i })));
    await db.collection('userScenarioResults').insertMany(Array.from({ length: 4 }, (_, i) => ({ participantID: '202600069', scenario_id: `June2026-AF${i}-assess`, evalNumber: 17 })));
    const result = await page({ evalNumbers: [17], participantTypes: ['Online'], completionFilters: ['All Text (4)'] }, 0, 1);
    expect(result.rows.map(row => row.pid)).toEqual(['202600069']);
    expect(result.totalCount).toBe(1);
    expect((await page({ sortField: 'simCount', descending: true }, 0, 1)).rows[0].pid).toBe('202600069');
    expect((await page({ searchPid: '0069' })).totalCount).toBe(1);
    expect((await page({ searchPid: '.*' })).totalCount).toBe(0);
    expect((await page({ completionFilters: ['Missing Text'] })).totalCount).toBe(69);
    expect((await page({ completionFilters: ['No Sim'] })).totalCount).toBe(1);
});

test('legacy evaluation inference prefers sim, completed survey, text, then log and separates UK', async () => {
    await db.collection('participantLog').insertMany([
        log(100, { evalNum: 17 }), log(101, { evalNum: 17 }), log(102, { evalNum: 17 }),
        log(103, { evalNum: 12 }), log(104, { evalNum: null }), log(202600105, { evalNum: null })
    ]);
    await db.collection('humanSimulator').insertOne({ pid: '100', evalNumber: 5, scenario_id: 'MJ2', timestamp: 1000 });
    await db.collection('surveyResults').insertOne({ results: { pid: '101', evalNumber: 16, orderLog: [] } });
    await db.collection('userScenarioResults').insertMany([
        { participantID: '100', evalNumber: 19 }, { participantID: '101', evalNumber: 19 }, { participantID: '102', evalNumber: 15 }
    ]);
    expect((await page({ phase: 'Phase 1' })).rows.map(r => [r.pid, r.evalNumber])).toEqual([['100', 5], ['104', 1]]);
    expect((await page({ phase: 'UK Phase 1' })).rows.map(r => r.pid)).toEqual(['103']);
    expect((await page()).rows.map(r => [r.pid, r.evalNumber])).toEqual([['101', 16], ['102', 15], ['202600105', 8]]);
});

test('delegation summaries preserve ordered pages, unique phase-2 scenarios, and complete-survey preference', async () => {
    await db.collection('participantLog').insertMany([log(100, { evalNum: 16 }), log(101, { evalNum: 5 })]);
    await db.collection('surveyResults').insertMany([
        { results: { pid: '100', evalNumber: 16, startTime: '2026-01-01T00:00:00Z', orderLog: ['Medic A', 'Medic B', 'Medic C', 'Medic D', 'Medic E', 'Medic F vs. Medic G'],
            'Medic A': { scenarioIndex: 'A' }, 'Medic B': { scenarioIndex: 'A' }, 'Medic C': { scenarioIndex: 'B' }, 'Medic D': { scenarioIndex: 'C' }, 'Medic E': { scenarioIndex: 'D' }, 'Medic F vs. Medic G': { scenarioIndex: 'ignored' } } },
        { results: { 'Participant ID Page': { questions: { 'Participant ID': { response: '101' } } }, evalNumber: 5, 'Post-Scenario Measures': {}, startTime: '2025-01-01T00:00:00Z', orderLog: ['A vs B', 'C vs D'], 'A vs B': { scenarioIndex: 'first' }, 'C vs D': { scenarioIndex: 'second' } } },
        { results: { pid: '101', evalNumber: 5, startTime: '2025-02-01T00:00:00Z', orderLog: [] } }
    ], { checkKeys: false });
    const p2 = await page({ completionFilters: ['Complete Delegation'] });
    expect(p2.rows[0].delegationScenarios).toEqual(['A', 'B', 'C', 'D']);
    expect(p2.rows[0].delegationCount).toBe(4);
    const p1 = (await page({ phase: 'Phase 1' })).rows[0];
    expect(p1.delegationScenarios).toEqual(['first', 'second']);
    expect(p1.delegationStart).toBe('2025-01-01T00:00:00Z');
});

test('progress includes compact alignment flags; details fetch full data only for the requested PID', async () => {
    await db.collection('participantLog').insertMany([log(100), log(101)]);
    await db.collection('userScenarioResults').insertMany([
        { participantID: '100', evalNumber: 17, scenario_id: 'June2026-AF-assess', mostLeastAligned: scored, 'AF-SS_mostLeastAligned': scored, answers: 'x'.repeat(50000) },
        { participantID: '100', evalNumber: 17, scenario_id: 'June2026-PS-assess', mostLeastAligned: [], combinedMostLeastAligned: scored },
        { participantID: '101', evalNumber: 17, scenario_id: 'other', answers: 'private to other participant' }
    ]);
    const result = await page({ searchPid: '100' });
    expect(result.rows[0].textResults.map(r => r.alignmentPopulated)).toEqual([true, false]);
    expect(JSON.stringify(result).length).toBeLessThan(3000);
    const details = await getParticipantProgressDetails(db, '100');
    expect(details.getAllScenarioResults).toHaveLength(2);
    expect(details.getAllScenarioResults[0].answers).toHaveLength(50000);
    expect(details.getAllScenarioResults.every(r => r.participantID === '100')).toBe(true);
});

test('page sizes and sort keys are bounded', async () => {
    await expect(page({}, 0, 201)).rejects.toThrow('Page size');
    await expect(page({}, -1)).rejects.toThrow('Page size');
    await expect(page({ sortField: 'arbitrary' })).rejects.toThrow('sort');
});

test('server alignment flags agree with full-record calculations across evaluations and missing-score shapes', async () => {
    await db.collection('participantLog').insertOne(log(100));
    const records = [];
    for (const evalNumber of [13, 15, 16, 17, 18, 19]) {
        for (const scenario_id of ['AF', 'MF', 'PS', 'SS', 'AF-trinary', 'April2026-subpopulation']) {
            for (const mostLeastAligned of [null, false, 0, '', [], {}, [{ response: [] }], scored]) {
                records.push({ participantID: '100', evalNumber, scenario_id, mostLeastAligned, combinedMostLeastAligned: scored,
                    'AF-PS_mostLeastAligned': scored, 'MF-PS_mostLeastAligned': null,
                    'AF-SS_mostLeastAligned': scored, 'MF-SS_mostLeastAligned': [], subPopResult: {} });
            }
        }
    }
    await db.collection('userScenarioResults').insertMany(records);
    const compact = (await page()).rows[0].textResults;
    expect(checkAlignmentStatus(compact, '100')).toEqual(checkAlignmentStatus(records, '100'));
});

test('GraphQL exposes the targeted reads and paginated response with real resolvers', async () => {
    const { makeExecutableSchema } = require('../../node-graphql/node_modules/@graphql-tools/schema');
    const { graphql } = require('../../node-graphql/node_modules/graphql');
    const { typeDefs, resolvers } = require('../../node-graphql/server.schema');
    const schema = makeExecutableSchema({ typeDefs: [typeDefs, 'type User { id: ID } input CreateUserInput { username: String }'], resolvers });
    await db.collection('participantLog').insertOne(log(100, { hashedEmail: 'hash' }));
    await db.collection('surveyVersion').insertOne({ lowPid: 100, highPid: 200 });
    const result = await graphql({ schema, contextValue: { db }, source: `
        query Reads($filter: ParticipantProgressFilter!, $pid: String!) {
            getParticipantByPid(pid: $pid)
            getParticipantByEmail(hashedEmail: "hash", evalNumber: 17)
            getNextParticipantId
            getParticipantProgress(filter: $filter, offset: 0, limit: 25)
            getParticipantProgressDetails(pid: $pid)
        }
    `, variableValues: { filter: { phase: 'Phase 2', evalNumbers: [17] }, pid: '100' } });
    expect(result.errors).toBeUndefined();
    expect(result.data.getParticipantByPid.ParticipantID).toBe(100);
    expect(result.data.getParticipantByEmail.ParticipantID).toBe(100);
    expect(result.data.getNextParticipantId).toBe(101);
    expect(result.data.getParticipantProgress.totalCount).toBe(1);
    expect(result.data.getParticipantProgressDetails).toEqual({ getAllScenarioResults: [], getAllSurveyResults: [] });
});
