const { surveyResultFilter } = require('./participantQueries');

const MAX_PAGE_SIZE = 200;
const SORT_FIELDS = new Set(['pid', 'textStart', 'simCount', 'delegationCount', 'textCount']);
const contains = (value, part) => ({ $gte: [{ $indexOfCP: [{ $ifNull: [value, ''] }, part] }, 0] });
const number = (value, fallback = null) => ({ $convert: { input: value, to: 'double', onError: fallback, onNull: fallback } });
// MongoDB treats empty strings as true; the original JavaScript summaries do not.
const truthy = value => ({ $cond: [{ $and: [{ $ifNull: [value, false] }, { $ne: [value, ''] }] }, true, false] });
const firstTruthy = (values, fallback) => values.reduceRight((next, value) => ({ $cond: [truthy(value), value, next] }), fallback);

function delegationScenarios() {
  const orderedPages = {
    $map: {
      input: { $ifNull: ['$results.orderLog', []] }, as: 'name',
      in: {
        name: '$$name',
        scenario: { $let: {
          vars: { page: { $arrayElemAt: [{ $filter: {
            input: { $objectToArray: { $ifNull: ['$results', {}] } }, as: 'page',
            cond: { $eq: ['$$page.k', '$$name'] }
          } }, 0] } },
          in: { $ifNull: ['$$page.v.scenarioIndex', null] }
        } }
      }
    }
  };
  return { $let: { vars: { pages: orderedPages }, in: { $slice: [{ $cond: [
    { $and: [{ $ne: ['$results.evalNumber', null] }, { $lt: [number('$results.evalNumber', 100), 10] }] },
    { $map: { input: { $filter: { input: '$$pages', as: 'page', cond: contains('$$page.name', ' vs ') } }, as: 'page', in: '$$page.scenario' } },
    { $reduce: {
      input: '$$pages', initialValue: [],
      in: { $cond: [{ $and: [
        contains('$$this.name', 'Medic'), { $not: [contains('$$this.name', 'vs.')] },
        truthy('$$this.scenario'), { $not: [{ $in: ['$$this.scenario', '$$value'] }] }
      ] }, { $concatArrays: ['$$value', ['$$this.scenario']] }, '$$value'] }
    } }
  ] }, 5] } } };
}

// Match the alignment-presence rules in progressUtils without returning scoring arrays.
function populated(value) {
  return { $cond: [
    { $isArray: value },
    { $anyElementTrue: [{ $map: { input: value, as: 'entry', in: {
      $gt: [{ $size: { $cond: [{ $isArray: '$$entry.response' }, '$$entry.response', []] } }, 0]
    } } }] },
    truthy(value)
  ] };
}

function alignmentPopulated() {
  const pair = (condition, field) => ({ $or: [{ $not: [condition] }, populated(`$${field}`)] });
  const afOrPs = { $or: [contains('$scenario_id', 'AF'), contains('$scenario_id', 'PS')] };
  return { $cond: [
    { $eq: ['$scenario_id', 'April2026-subpopulation'] }, truthy('$subPopResult'),
    { $and: [
      populated(firstTruthy(['$mostLeastAligned'], '$combinedMostLeastAligned')),
      pair({ $and: [{ $eq: ['$evalNumber', 16] }, afOrPs] }, 'AF-PS_mostLeastAligned'),
      pair({ $and: [{ $eq: ['$evalNumber', 16] }, { $or: [contains('$scenario_id', 'MF'), contains('$scenario_id', 'PS')] }] }, 'MF-PS_mostLeastAligned'),
      pair({ $and: [{ $eq: ['$evalNumber', 17] }, { $not: [contains('$scenario_id', 'trinary')] }, { $or: [contains('$scenario_id', 'AF'), contains('$scenario_id', 'SS')] }] }, 'AF-SS_mostLeastAligned'),
      pair({ $and: [{ $in: ['$evalNumber', [18, 19]] }, afOrPs] }, 'AF-PS_mostLeastAligned'),
      pair({ $and: [{ $in: ['$evalNumber', [18, 19]] }, { $or: [contains('$scenario_id', 'MF'), contains('$scenario_id', 'SS')] }] }, 'MF-SS_mostLeastAligned')
    ] }
  ] };
}

function progressSummaryStages() {
  return [
    { $match: { Type: { $exists: true, $nin: [null, '', false, 0] }, ParticipantID: { $exists: true, $ne: null } } },
    { $addFields: { pid: { $toString: '$ParticipantID' } } },
    { $lookup: {
      from: 'humanSimulator', let: { pid: '$pid' }, as: 'sims', pipeline: [
        { $match: { $expr: { $eq: ['$pid', '$$pid'] } } },
        { $sort: { timestamp: 1, _id: 1 } }, { $limit: 4 },
        { $project: { _id: 0, timestamp: 1, scenario_id: 1, evalNumber: 1, evalName: 1 } }
      ]
    } },
    { $lookup: {
      from: 'userScenarioResults', let: { pid: '$pid' }, as: 'text', pipeline: [
        { $match: { participantID: { $not: /test/i }, $expr: { $eq: ['$participantID', '$$pid'] } } },
        { $sort: { _id: 1 } },
        { $group: { _id: null, count: { $sum: 1 }, start: { $first: '$startTime' }, end: { $last: '$timeComplete' }, evalNumber: { $last: '$evalNumber' }, evalName: { $last: '$evalName' } } }
      ]
    } },
    { $lookup: {
      from: 'surveyResults', let: { pid: '$pid' }, as: 'surveys', pipeline: [
        { $match: { $and: [surveyResultFilter, { $expr: { $or: [
          { $eq: ['$results.pid', '$$pid'] },
          { $eq: ['$results.Participant ID Page.questions.Participant ID.response', '$$pid'] }
        ] } }] } },
        { $sort: { _id: 1 } },
        { $project: {
          _id: 0, start: '$results.startTime', end: '$results.timeComplete',
          evalNumber: { $ifNull: ['$evalNumber', '$results.evalNumber'] },
          evalName: { $ifNull: ['$evalName', '$results.evalName'] },
          complete: { $or: [{ $gte: [number('$results.evalNumber'), 15] }, truthy('$results.Post-Scenario Measures')] },
          scenarios: delegationScenarios()
        } },
        { $group: { _id: null, last: { $last: '$$ROOT' }, completed: { $push: { $cond: ['$complete', '$$ROOT', null] } } } },
        { $project: { last: 1, completed: { $arrayElemAt: [{ $filter: { input: '$completed', as: 'survey', cond: { $ne: ['$$survey', null] } } }, -1] } } }
      ]
    } },
    { $addFields: { sim: { $arrayElemAt: ['$sims', 0] }, text: { $arrayElemAt: ['$text', 0] }, survey: { $arrayElemAt: ['$surveys', 0] } } },
    { $addFields: { selectedSurvey: { $ifNull: ['$survey.completed', '$survey.last'] } } },
    { $project: {
      pid: 1, participantType: '$Type', createdAt: '$timeCreated', prolificId: 1, contactId: 1,
      evalNumber: number(firstTruthy(['$sim.evalNumber', '$survey.completed.evalNumber', '$text.evalNumber', '$evalNum'], { $cond: [{ $gt: [number('$pid'), 202506100] }, 8, 1] }), 1),
      evalName: { $ifNull: ['$sim.evalName', { $ifNull: ['$survey.completed.evalName', '$text.evalName'] }] },
      simTimestamp: '$sim.timestamp', simCount: { $ifNull: ['$simEntryCount', 0] }, simScenarios: '$sims.scenario_id',
      delegationStart: '$selectedSurvey.start', delegationEnd: '$survey.completed.end',
      delegationScenarios: { $ifNull: ['$selectedSurvey.scenarios', []] },
      textStart: '$text.start', textEnd: '$text.end', textCount: { $ifNull: ['$text.count', 0] }
    } },
    { $addFields: {
      phase: { $cond: [{ $eq: ['$evalNumber', 12] }, 'UK Phase 1', { $cond: [{ $gte: ['$evalNumber', 8] }, 'Phase 2', 'Phase 1'] }] },
      delegationCount: { $size: { $filter: { input: '$delegationScenarios', as: 'scenario', cond: truthy('$$scenario') } } },
      textStartSort: { $convert: { input: { $convert: { input: '$textStart', to: 'date', onError: null, onNull: null } }, to: 'long', onError: -1, onNull: -1 } }
    } }
  ];
}

function filteredMatch(filter) {
  const match = {};
  if (filter.evalNumbers?.length) match.evalNumber = { $in: filter.evalNumbers };
  if (filter.participantTypes?.length) match.participantType = { $in: filter.participantTypes };
  if (filter.searchPid) match.pid = { $regex: filter.searchPid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') };
  const conditions = [];
  const textThreshold = filter.phase === 'Phase 1' ? 5 : 4;
  const delThreshold = filter.phase === 'UK Phase 1' ? 3 : filter.phase === 'Phase 1' ? 4 : { $cond: [{ $in: ['$evalNumber', [10, 16]] }, 4, 5] };
  for (const completion of filter.completionFilters || []) {
    switch (completion) {
      case `All Text (${textThreshold})`: conditions.push({ $gte: ['$textCount', textThreshold] }); break;
      case 'Missing Text': conditions.push({ $lt: ['$textCount', textThreshold] }); break;
      case 'Complete Delegation': conditions.push({ $gte: ['$delegationCount', delThreshold] }); break;
      case 'No Delegation': conditions.push({ $eq: ['$delegationCount', 0] }); break;
      case 'All Sim (4)': conditions.push({ $gte: ['$simCount', 4] }); break;
      case 'Any Sim': conditions.push({ $gte: ['$simCount', 1] }); break;
      case 'No Sim': conditions.push({ $eq: ['$simCount', 0] }); break;
      case 'Adept + OW Sim':
        for (const name of ['MJ', 'open_world']) conditions.push({ $anyElementTrue: [{ $map: { input: '$simScenarios', as: 'id', in: contains('$$id', name) } }] });
        break;
      default: throw new Error('Unknown progress filter.');
    }
  }
  if (conditions.length) match.$expr = { $and: conditions };
  return match;
}

async function getParticipantProgress(db, { filter = {}, offset = 0, limit = 50 }) {
  if (!['Phase 1', 'Phase 2', 'UK Phase 1'].includes(filter.phase)) throw new Error('Select a valid phase.');
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) throw new Error(`Page size must be between 1 and ${MAX_PAGE_SIZE}.`);
  const sortField = filter.sortField || 'pid';
  if (!SORT_FIELDS.has(sortField)) throw new Error('Unknown progress sort.');
  const sort = { [sortField === 'textStart' ? 'textStartSort' : sortField]: filter.descending ? -1 : 1, _id: 1 };
  const match = filteredMatch(filter);
  const [result] = await db.collection('participantLog').aggregate([
    ...progressSummaryStages(),
    { $match: { phase: filter.phase } },
    // Metadata covers the phase; filters/sort are applied BEFORE selecting a page.
    { $facet: {
      metadata: [{ $group: { _id: null, total: { $sum: 1 }, participantTypes: { $addToSet: '$participantType' }, evaluations: { $addToSet: { evalNumber: '$evalNumber', evalName: '$evalName' } } } }],
      count: [{ $match: match }, { $count: 'total' }],
      rows: [{ $match: match }, { $sort: sort }, { $skip: offset }, { $limit: limit }, { $project: { textStartSort: 0 } }]
    } }
  ], { allowDiskUse: true }).toArray();
  const rows = result?.rows || [];
  if (rows.length) {
    const details = await db.collection('userScenarioResults').aggregate([
      { $match: { participantID: { $in: rows.map(row => row.pid), $not: /test/i } } },
      { $sort: { _id: 1 } },
      { $project: { participantID: 1, scenario_id: 1, evalNumber: 1, alignmentPopulated: alignmentPopulated() } }
    ]).toArray();
    const byPid = new Map(rows.map(row => [row.pid, []]));
    for (const detail of details) byPid.get(detail.participantID).push(detail);
    for (const row of rows) row.textResults = byPid.get(row.pid);
  }
  const metadata = result?.metadata[0];
  return { rows, totalCount: result?.count[0]?.total || 0, phaseCount: metadata?.total || 0,
    participantTypes: metadata?.participantTypes || [], evaluations: metadata?.evaluations || [] };
}

module.exports = { getParticipantProgress, progressSummaryStages, alignmentPopulated, MAX_PAGE_SIZE };
