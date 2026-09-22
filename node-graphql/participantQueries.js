// Small participant reads used by entry flows and progress-table dialogs.
const surveyResultFilter = {
  'results.Participant ID.questions.Participant ID.response': { $not: /test/i },
  'results.Participant ID Page.questions.Participant ID.response': { $not: /test/i },
  'Participant ID.questions.Participant ID.response': { $not: /test/i },
  'Participant ID Page.questions.Participant ID.response': { $not: /test/i },
  $or: [
    { 'results.surveyVersion': { $ne: 2 } },
    { 'results.Participant ID Page.questions.Participant ID.response': /^2024/ }
  ]
};

function participantIdFilter(pid) {
  const ids = [pid];
  const numericPid = Number(pid);
  // Preserve string IDs (including leading zeroes and legacy suffixes).
  if (Number.isFinite(numericPid) && String(numericPid) === pid) ids.push(numericPid);
  return { ParticipantID: { $in: ids } };
}

async function getParticipantByEmail(db, hashedEmail, evalNumber) {
  const filter = { hashedEmail };
  if (evalNumber != null) filter.evalNum = { $in: [evalNumber, String(evalNumber)] };
  return db.collection('participantLog').findOne(filter, {
    projection: { _id: 0, ParticipantID: 1, textEntryCount: 1, evalNum: 1 },
    sort: { _id: 1 }
  });
}

async function getNextParticipantId(db) {
  const bounds = await db.collection('surveyVersion').findOne({}, {
    projection: { lowPid: 1, highPid: 1 }
  });
  const low = Number(bounds?.lowPid);
  const high = Number(bounds?.highPid);
  if (!Number.isSafeInteger(low) || !Number.isSafeInteger(high) || low > high) {
    throw new Error('Participant ID bounds are not configured correctly.');
  }

  const participants = db.collection('participantLog');
  const [numeric, legacy] = await Promise.all([
    participants.find({ ParticipantID: { $type: 'number', $gte: low, $lte: high } })
      .project({ ParticipantID: 1 }).sort({ ParticipantID: -1 }).limit(1).toArray(),
    // Older imports can store PIDs as strings; ignore nonnumeric suffixes.
    participants.aggregate([
      { $match: { ParticipantID: { $type: 'string' } } },
      { $project: { pid: { $convert: { input: '$ParticipantID', to: 'double', onError: null, onNull: null } } } },
      { $match: { pid: { $gte: low, $lte: high } } },
      { $group: { _id: null, pid: { $max: '$pid' } } }
    ]).toArray()
  ]);
  const nextPid = Math.max(low - 1, numeric[0]?.ParticipantID ?? low - 1, legacy[0]?.pid ?? low - 1) + 1;
  if (nextPid > high) throw new Error('The participant ID range is full.');
  // This is the existing candidate-ID flow. The insertion mutation still handles collisions.
  return nextPid;
}

async function getParticipantProgressDetails(db, pid) {
  const [text, surveys] = await Promise.all([
    db.collection('userScenarioResults').find({ participantID: pid, $and: [{ participantID: { $not: /test/i } }] })
      .sort({ _id: 1 }).toArray(),
    db.collection('surveyResults').find({ $and: [surveyResultFilter, {
      $or: [
        { 'results.pid': pid },
        { 'results.Participant ID Page.questions.Participant ID.response': pid }
      ]
    }] }).project({ 'results.user': 0, user: 0 }).sort({ _id: 1 }).toArray()
  ]);
  return { getAllScenarioResults: text, getAllSurveyResults: surveys };
}

module.exports = { surveyResultFilter, participantIdFilter, getParticipantByEmail, getNextParticipantId, getParticipantProgressDetails };
