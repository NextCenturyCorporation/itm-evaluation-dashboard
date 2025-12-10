const { gql } = require('apollo-server');
const { ObjectId } = require('mongodb');
const { GraphQLScalarType, Kind, GraphQLError } = require("graphql");
const jwt = require('jsonwebtoken');

const typeDefs = gql`
  scalar JSON

  scalar StringOrFloat

  extend input CreateUserInput {
    admin: Boolean
  }

  extend type User {
    admin: Boolean
    evaluator: Boolean
    experimenter: Boolean
    adeptUser: Boolean
    approved: Boolean
    rejected: Boolean
  }

  type Query {
    getUsers(caller: JSON): JSON @complexity(value: 50)
    checkUserExists(email: String!, username: String!): Boolean! @complexity(value: 5)
    getHistory(id: ID): JSON @complexity(value: 10)
    getAllHistory(id: ID): [JSON] @complexity(value: 150)
    getAllHistoryByEvalNumber(evalNumber: Float, showMainPage: Boolean): [JSON] @complexity(value: 75)
    getGroupAdmAlignmentByEval(evalNumber: Float): [JSON] @complexity(value: 80)
    getAllEvalData: [JSON] @complexity(value: 10)
    getEvalIdsForAllHistory: [JSON] @complexity(value: 10)
    getAllHistoryByID(historyId: ID): JSON @complexity(value: 25)
    getScenario(scenarioId: ID): JSON @complexity(value: 10)
    getScenarioNames: [JSON] @complexity(value: 15)
    getScenarioNamesByEval(evalNumber: Float): [JSON] @complexity(value: 20)
    getPerformerADMsForScenario(admQueryStr: String, scenarioID: ID, evalNumber: Float): JSON @complexity(value: 30)
    getAlignmentTargetsPerScenario(evalNumber: Float, scenarioID: ID, admName: ID): JSON @complexity(value: 30)
    getTestByADMandScenario(admQueryStr: String, scenarioID: ID, admName: ID, alignmentTarget: String, evalNumber: Int): JSON @complexity(value: 50)
    getAllTestDataForADM(admQueryStr: String, scenarioID: ID, admName: ID, alignmentTargets: [String], evalNumber: Int): [JSON] @complexity(value: 100)
    getAllScenarios(id: ID): [JSON] @complexity(value: 30)
    getAllHumanRuns: [JSON] @complexity(value: 5)
    getAllImages: [JSON] @complexity(value: 20)
    getAllSurveyResults: [JSON] @complexity(value: 100)
    getAllSurveyResultsByEval(evalNumber: Float): [JSON] @complexity(value: 100)
    getSurveyResultsByEvalArray(evalNumbers: [Float!]!): [JSON] @complexity(value: 100)
    getAllScenarioResults: [JSON] @complexity(value: 100)
    getAllScenarioResultsByEval(evalNumber: Float): [JSON] @complexity(value: 100)
    getAllTextScenariosDRE: [JSON] @complexity(value: 30)
    getEvalIdsForAllScenarioResults: [JSON] @complexity(value: 25)
    getAllSimAlignment: [JSON] @complexity(value: 90)
    getAllSimAlignmentByEval(evalNumber: Float): [JSON] @complexity(value: 85)
    getEvalIdsForSimAlignment: [JSON] @complexity(value: 20)
    getEvalNameNumbers: [JSON] @complexity(value: 15)
    getEvalIdsForHumanResults: [JSON] @complexity(value: 20)
    getAllRawSimData: [JSON] @complexity(value: 180)
    getAllSurveyConfigs: [JSON] @complexity(value: 200)
    getAllSurveyVersions: [Float] @complexity(value: 10)
    getAllTextBasedConfigs: [JSON] @complexity(value: 150)
    getAllImageUrls: [JSON] @complexity(value: 150)
    getAllTextBasedImages: [JSON] @complexity(value: 200)
    countHumanGroupFirst: Int @complexity(value: 10)
    countAIGroupFirst: Int @complexity(value: 10)
    getParticipantLog: [JSON] @complexity(value: 50)
    getHumanToADMComparison: [JSON] @complexity(value: 250)
    getCurrentSurveyVersion: String @complexity(value: 5)
    getCurrentStyle: String @complexity(value: 5)
    getADMTextProbeMatches: [JSON] @complexity(value: 250)
    getMultiKdmaAnalysisData: [JSON] @complexity(value: 200)
    getMultiKdmaAnalysisDataEval11: [JSON] @complexity(value: 200)
    getCurrentTextEval: String @complexity(value: 5)
    getTextEvalOptions: [String] @complexity(value: 10)
    getPidBounds: JSON @complexity(value: 5)
    getShowDemographics: JSON @complexity(value: 5)
    getSurveyConfigByVersion(version: String!): [JSON] @complexity(value: 50)
    getTextBasedConfigByEval(evalName: String!): [JSON] @complexity(value: 50)
  }

  type Mutation {
    updateAdminUser(caller: JSON, username: String, isAdmin: Boolean): JSON,
    updateEvaluatorUser(caller: JSON, username: String, isEvaluator: Boolean): JSON,
    updateExperimenterUser(caller: JSON, username: String, isExperimenter: Boolean): JSON,
    updateAdeptUser(caller: JSON, username: String, isAdeptUser: Boolean): JSON,
    updateUserApproval(caller: JSON, username: String, isApproved: Boolean, isRejected: Boolean, isAdmin: Boolean, isEvaluator: Boolean, isExperimenter: Boolean, isAdeptUser: Boolean): JSON,
    updateEvalData(caller: JSON, dataToUpdate: JSON): JSON,
    addNewEval(caller: JSON, newEval: JSON): JSON,
    deleteEval(caller: JSON, evalId: String): JSON,
    uploadSurveyResults(surveyId: String, results: JSON): JSON,
    uploadScenarioResults(results: [JSON]): JSON,
    addNewParticipantToLog(participantData: JSON): JSON,
    updateSurveyVersion(version: String!): String,
    updateUIStyle(version: String!): String,
    updateParticipantLog(pid: String, updates: JSON): JSON,
    getServerTimestamp: String,
    updateTextEval(eval: String!): String
    updatePidBounds(lowPid: Int!, highPid: Int!): JSON,
    updateShowDemographics(showDemographics: Boolean!): JSON,
    deleteDataByPID(caller: JSON, pid: String): JSON
  }

  directive @complexity(value: Int) on FIELD_DEFINITION
`;

const generateServerTimestamp = () => {
  process.env.TZ = 'America/New_York';
  const date = new Date();

  const januaryOffset = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const currentOffset = date.getTimezoneOffset();
  const isDST = currentOffset < januaryOffset;

  return date.toString().replace(/GMT-0[45]00 \(Eastern (Daylight|Standard) Time\)/,
    isDST ? 'GMT-0400 (Eastern Daylight Time)' : 'GMT-0500 (Eastern Standard Time)');
};

const resolvers = {
  Query: {
    checkUserExists: async (obj, args, context, infow) => {
      const userByEmail = await context.db.collection('users').findOne({
        $or: [
          { "emails.address": { $regex: `^${args.email.toLowerCase().trim()}$`, $options: 'i' } },
          { "username": { $regex: `^${args.username.toLowerCase().trim()}$`, $options: 'i' } }
        ]
      });
      return !!userByEmail;
    },
    getHistory: async (obj, args, context, inflow) => {
      return await context.db.collection('admTargetRuns').findOne(args).then(result => { return result; });
    },
    getAllHistory: async (obj, args, context, inflow) => {
      return await context.db.collection('admTargetRuns').find().toArray().then(result => { return result; });
    },
    getAllHistoryByEvalNumber: async (obj, args, context, inflow) => {
      const docs = await context.db.collection('admTargetRuns').find({ "evalNumber": args["evalNumber"] }, {
        projection: {
          "synthetic": 1,
          "probe_ids": 1,
          "scenario": 1,
          "alignment_target": 1,
          "evaluation": 1,
          "results": 1,
          "adm_name": 1,
          "history.parameters.adm_name": 1,
          "history.response.id": 1,
          "history.parameters.target_id": 1,
          "history.response.kdma_values.value": 1,
          "history.parameters.target_id": 1,
          "history.response.score": 1,
          "history.response.distance_based_score": 1,
          "history.response.dre_alignment.score": 1,
          "history.parameters.session_id": 1,
          "history.parameters.dreSessionId": 1,
          "history.command": 1,
          "history.parameters.probe_id": 1
        }
      }).toArray();
      return docs.map(doc => {
        if (!Array.isArray(doc.probe_ids) || doc.probe_ids.length === 0) {
          doc.probe_ids = (doc.history || [])
            .filter(h => h.command === 'Respond to TA1 Probe')
            .map(h => h.parameters?.probe_id);
        }
        return doc;
      });
    },
    getGroupAdmAlignmentByEval: async (obj, args, context, inflow) => {
      return await context.db.collection('admTargetRuns').find({
        "evalNumber": args["evalNumber"],
        $expr: {
          $in: [
            { $arrayElemAt: ["$history.parameters.target_id", -1] },
            [
              "ADEPT-DryRun-Ingroup Bias-Group-High",
              "ADEPT-DryRun-Ingroup Bias-Group-Low",
              "ADEPT-DryRun-Moral judgement-Group-High",
              "ADEPT-DryRun-Moral judgement-Group-Low",
              "qol-group-target-dre-1",
              "qol-group-target-dre-2",
              "vol-group-target-dre-1",
              "vol-group-target-dre-2",
              "ADEPT-Phase1Eval-Ingroup Bias-Group-Low",
              "ADEPT-Phase1Eval-Moral judgement-Group-Low",
              "ADEPT-Phase1Eval-Moral judgement-Group-High",
              "ADEPT-Phase1Eval-Ingroup Bias-Group-High",
              "qol-group-target-1-final-eval",
              "vol-group-target-1-final-eval",
              "qol-group-target-2-final-eval",
              "vol-group-target-2-final-eval"
            ]
          ]
        }
      },
        {
          projection: {
            "history.parameters.adm_name": 1,
            "history.response.id": 1,
            "history.parameters.target_id": 1,
            "history.response.kdma_values.value": 1,
            "history.parameters.target_id": 1,
            "history.response.score": 1,
            "history.parameters.session_id": 1,
            "history.command": 1
          }
        }).toArray().then(result => { return result; });
    },
    getAllEvalData: async (obj, args, context, inflow) => {
      return await context.db.collection('evalData').find().toArray().then(result => { return result; });
    },
    getEvalIdsForAllHistory: async (obj, args, context, inflow) => {
      return await context.db.collection('admTargetRuns').aggregate(
        [{ "$group": { "_id": { evalNumber: "$evalNumber", evalName: "$evalName" } } }]).sort({ 'evalNumber': -1 }).toArray().then(result => { return result });
    },
    getAllHistoryByID: async (obj, args, context, inflow) => {
      return await context.db.collection('admTargetRuns').find({ "history.response.id": args.historyId }, { projection: { "evaluation": 1, "history.parameters.adm_name": 1, "history.parameters.ADM Name": 1, "history.response.score": 1, "evalNumber": 1 } }).toArray().then(result => { return result; });
    },
    getScenario: async (obj, args, context, inflow) => {
      return await context.db.collection('scenarios').findOne({ "id": args["scenarioId"] }).then(result => { return result; });
    },
    getScenarioNames: async (obj, args, context, inflow) => {
      return await context.db.collection('scenarios').aggregate([{ $group: { _id: { "id": '$id', "name": '$name' } } }])
        .toArray().then(result => { return result });
    },
    getScenarioNamesByEval: async (obj, args, context, inflow) => {
      // all from scenarios collection
      const scenarios = await context.db.collection('scenarios')
        .find({ "evalNumber": args["evalNumber"] })
        .toArray();

      const scenariosWithData = [];
      // only return scenarios with at least one adm run
      for (const scenario of scenarios) {
        const hasData = await context.db.collection('admTargetRuns')
          .findOne({
            "scenario": scenario.id,
            "evalNumber": args["evalNumber"]
          });

        if (hasData) {
          scenariosWithData.push({
            _id: {
              id: scenario.id,
              name: scenario.name
            }
          });
        }
      }

      return scenariosWithData;
    },
    getPerformerADMsForScenario: async (obj, args, context, inflow) => {
      const query = { "scenario": args["scenarioID"] };

      if (args["evalNumber"] !== undefined && args["evalNumber"] !== null) {
        query["evalNumber"] = args["evalNumber"];
      }

      return await context.db.collection('admTargetRuns')
        .distinct("adm_name", query)
        .then(result => { return result });
    },
    getAlignmentTargetsPerScenario: async (obj, args, context, inflow) => {
      const query = {
        "scenario": args["scenarioID"],
        "evalNumber": args["evalNumber"]
      };

      if (args["admName"] !== undefined && args["admName"] !== null) {
        query["adm_name"] = args["admName"];
      }

      let alignmentTargets = await context.db.collection('admTargetRuns')
        .distinct("alignment_target", query)
        .then(result => { return result });

      // The scenarioID still comes back in this distinct because of the way the JSON is configured, remove it before sending the array
      const indexOfScenario = alignmentTargets.indexOf(args["scenarioID"]);
      if (indexOfScenario >= 0) {
        alignmentTargets.splice(indexOfScenario, 1);
      }

      return alignmentTargets;
    },
    getTestByADMandScenario: async (obj, args, context, inflow) => {
      let queryObj = {};

      if (args["alignmentTarget"] == null || args["alignmentTarget"] == undefined || args["alignmentTarget"] == "null") {
        queryObj = {
          $and: [
            { "history.response.id": args["scenarioID"] }
          ]
        };

        if (args["evalNumber"]) {
          queryObj.$and.push({ "evalNumber": args["evalNumber"] });
        }

        queryObj[args["admQueryStr"]] = args["admName"];
      } else {
        queryObj = {
          $and: [
            { "alignment_target": args["alignmentTarget"] },
            { "scenario": args["scenarioID"] }
          ]
        };

        if (args["evalNumber"]) {
          queryObj.$and.push({ "evalNumber": args["evalNumber"] });
        }

        queryObj["adm_name"] = args["admName"];
      }

      return await context.db.collection('admTargetRuns').findOne(queryObj).then(result => { return result });
    },
    getAllTestDataForADM: async (obj, args, context, inflow) => {
      const results = [];

      for (const target of args.alignmentTargets) {
        let queryObj = {
          scenario: args.scenarioID,
          adm_name: args.admName,
          alignment_target: target
        };

        if (args.evalNumber) {
          queryObj.evalNumber = args.evalNumber;
        }

        let result = await context.db.collection('admTargetRuns').findOne(queryObj);

        if (result) {
          results.push({
            alignmentTarget: target,
            data: result,
            probe_ids: result.probe_ids,
            probe_responses: result.probe_responses
          });
          continue;
        }

        // fallback
        queryObj = {
          $and: [
            { "history.response.id": args.scenarioID }
          ]
        };

        if (target) {
          queryObj.$and.push({ "history.response.id": target });
        }

        if (args.evalNumber) {
          queryObj.$and.push({ "evalNumber": args.evalNumber });
        }

        queryObj[args.admQueryStr] = args.admName;

        result = await context.db.collection('admTargetRuns').findOne(queryObj);

        if (result) {
          results.push({
            alignmentTarget: target,
            data: result
          });
        }
      }

      return results;
    },
    getAllScenarios: async (obj, args, context, inflow) => {
      return await context.db.collection('scenarios').find().toArray().then(result => { return result; });
    },
    getAllHumanRuns: async (obj, args, context, inflow) => {
      return await context.db.collection('humanRuns').find({ "runId": { $exists: true } }).toArray().then(result => { return result; });
    },
    getAllImages: async (obj, args, context, inflow) => {
      return await context.db.collection('humanRuns').find({ "bytes": { $exists: true } }).toArray().then(result => { return result; });
    },
    getAllTextBasedImages: async (obj, args, context, inflow) => {
      return await context.db.collection('textBasedImages').find().toArray().then(result => { return result; })
    },
    getAllSurveyResults: async (obj, args, context, inflow) => {
      // return all survey results except for those containing "test" in participant ID

      const excludeTestID = {
        "results.Participant ID.questions.Participant ID.response": { $not: /test/i },
        "results.Participant ID Page.questions.Participant ID.response": { $not: /test/i },
        "Participant ID.questions.Participant ID.response": { $not: /test/i },
        "Participant ID Page.questions.Participant ID.response": { $not: /test/i }
      };

      // Filter based on surveyVersion and participant ID starting with "2024" (only for version 2)
      const surveyVersionFilter = {
        $or: [
          { "results.surveyVersion": { $ne: 2 } },
          {
            $and: [
              { "results.surveyVersion": 2 },
              { "results.Participant ID Page.questions.Participant ID.response": { $regex: /^2024/ } }
            ]
          }
        ]
      };

      return await context.db.collection('surveyResults').find({
        $and: [excludeTestID, surveyVersionFilter]
      }).project({
        // dont return user field
        "results.user": 0,
        "user": 0
      }).toArray().then(result => { return result; });
    },
    getAllSurveyResultsByEval: async (obj, args, context, inflow) => {
      // return all survey results except for those containing "test" in participant ID

      const excludeTestID = {
        "results.Participant ID.questions.Participant ID.response": { $not: /test/i },
        "results.Participant ID Page.questions.Participant ID.response": { $not: /test/i },
        "Participant ID.questions.Participant ID.response": { $not: /test/i },
        "Participant ID Page.questions.Participant ID.response": { $not: /test/i }
      };

      // Filter based on surveyVersion and participant ID starting with "2024" (only for version 2)
      const surveyVersionFilter = {
        $or: [
          { "results.surveyVersion": { $ne: 2 } },
          {
            $and: [
              { "results.surveyVersion": 2 },
              { "results.Participant ID Page.questions.Participant ID.response": { $regex: /^2024/ } }
            ]
          }
        ]
      };

      return await context.db.collection('surveyResults').find({
        $and: [excludeTestID, surveyVersionFilter, {
          $or: [{ "evalNumber": args["evalNumber"] }, { "results.evalNumber": args["evalNumber"] }]
        }]
      }).project({
        // dont return user field
        "results.user": 0,
        "user": 0
      }).toArray().then(result => { return result; });
    },
    getSurveyResultsByEvalArray: async (obj, args, context, inflow) => {
      const { evalNumbers } = args;

      // If nothing passed in, just return an empty array
      if (!evalNumbers || evalNumbers.length === 0) {
        return [];
      }

      // return all survey results except for those containing "test" in participant ID
      const excludeTestID = {
        "results.Participant ID.questions.Participant ID.response": { $not: /test/i },
        "results.Participant ID Page.questions.Participant ID.response": { $not: /test/i },
        "Participant ID.questions.Participant ID.response": { $not: /test/i },
        "Participant ID Page.questions.Participant ID.response": { $not: /test/i }
      };

      // Filter based on surveyVersion and participant ID starting with "2024" (only for version 2)
      const surveyVersionFilter = {
        $or: [
          { "results.surveyVersion": { $ne: 2 } },
          {
            $and: [
              { "results.surveyVersion": 2 },
              { "results.Participant ID Page.questions.Participant ID.response": { $regex: /^2024/ } }
            ]
          }
        ]
      };

      // Match ANY evalNumber in the evalNumbers array
      return context.db.collection("surveyResults")
        .find({
          $and: [
            excludeTestID,
            surveyVersionFilter,
            {
              $or: [
                { evalNumber: { $in: evalNumbers } },
                { "results.evalNumber": { $in: evalNumbers } }
              ]
            }
          ]
        })
        .project({
          // don't return user field
          "results.user": 0,
          user: 0
        })
        .toArray();
    },
    getAllScenarioResults: async (obj, args, context, inflow) => {
      return await context.db.collection('userScenarioResults').find({
        "participantID": { $not: /test/i }
      }).toArray().then(result => { return result; });
    },
    getAllScenarioResultsByEval: async (obj, args, context, inflow) => {
      return await context.db.collection('userScenarioResults').find({
        "participantID": { $not: /test/i },
        "evalNumber": args["evalNumber"]
      }).toArray().then(result => { return result; });
    },
    getAllTextScenariosDRE: async (obj, args, context, inflow) => {
      return await context.db.collection('userScenarioResults').distinct(
        "scenario_id",
        { "evalNumber": 4 }
      ).then(result => { return result; });
    },
    getEvalIdsForAllScenarioResults: async (obj, args, context, inflow) => {
      return await context.db.collection('userScenarioResults').aggregate(
        [{ "$group": { "_id": { evalNumber: "$evalNumber", evalName: "$evalName" } } }]).sort({ 'evalNumber': -1 }).toArray().then(result => { return result });
    },
    getAllSimAlignment: async (obj, args, context, inflow) => {
      return await context.db.collection('humanSimulator').find().toArray().then(result => { return result; });
    },
    getAllSimAlignmentByEval: async (obj, args, context, inflow) => {
      return await context.db.collection('humanSimulator').find(
        { "evalNumber": args["evalNumber"] }
      ).toArray().then(result => { return result; });
    },
    getEvalIdsForSimAlignment: async (obj, args, context, inflow) => {
      return await context.db.collection('humanSimulator').aggregate(
        [{ "$group": { "_id": { evalNumber: "$evalNumber", evalName: "$evalName" } } }]).sort({ 'evalNumber': -1 }).toArray().then(result => { return result });
    },
    getEvalNameNumbers: async (obj, args, context, inflow) => {
      return await context.db.collection('admTargetRuns').aggregate(
        [{ "$group": { "_id": { evalNumber: "$evalNumber", evalName: "$evalName" } } }]).toArray().then(result => { return result });
    },
    getEvalIdsForHumanResults: async (obj, args, context, inflow) => {
      return await context.db.collection('humanSimulatorRaw').aggregate(
        [{ "$group": { "_id": { evalNumber: "$evalNumber", evalName: "$evalName" } } }]).sort({ 'evalNumber': -1 }).toArray().then(result => { return result });
    },
    getAllRawSimData: async (obj, args, context, inflow) => {
      return await context.db.collection('humanSimulatorRaw').find().toArray().then(result => { return result; });
    },
    getUsers: async (obj, args, context, infow) => {
      const session = await context.db.collection('sessions')
        .find({ "_id": new ObjectId(args['caller']?.['sessionId']) })
        ?.project({ "userId": 1, "valid": 1 })
        .toArray()
        .then(result => { return result[0] });

      const user = await context.db.collection('users')
        .find({ "username": args['caller']?.['username'] })
        ?.project({ "_id": 1, "username": 1, "admin": 1 })
        .toArray()
        .then(result => { return result[0] });

      if (session?.valid && (session?.userId == user?._id) && user?.admin) {
        return await context.db.collection('users')
          .find()
          .project({ "services": 0, "createdAt": 0, "updatedAt": 0 })
          .toArray()
          .then(result => { return result });
      } else {
        throw new GraphQLError('Users outside of the admin group cannot access user data.', {
          extensions: { code: '404' }
        });
      }
    },
    getAllSurveyConfigs: async (obj, args, context, inflow) => {
      return await context.db.collection('delegationConfig').find().toArray().then(result => { return result; });
    },
    getAllSurveyVersions: async (obj, args, context, info) => {
      // Get each unique survey version from the delegationConfig collection
      const versions = await context.db
        .collection("delegationConfig")
        .distinct("survey.version");

      // Ensure they are numbers and sort them
      const numericVersions = versions
        .map((v) => Number(v))
        .filter((v) => !Number.isNaN(v));

      numericVersions.sort((a, b) => a - b);

      return numericVersions;
    },
    getAllImageUrls: async (obj, args, context, inflow) => {
      return await context.db.collection('delegationMedia').find().toArray().then(result => { return result; });
    },
    getAllTextBasedConfigs: async (obj, args, context, inflow) => {
      return await context.db.collection('textBasedConfig').find().toArray().then(result => { return result; });
    },
    countHumanGroupFirst: async (obj, args, context, info) => {
      return await context.db.collection('surveyResults').countDocuments({ "results.humanGroupFirst": true });
    },
    countAIGroupFirst: async (obj, args, context, info) => {
      return await context.db.collection('surveyResults').countDocuments({ "results.aiGroupFirst": true });
    },
    getParticipantLog: async (obj, args, context, info) => {
      return await context.db.collection('participantLog').find().toArray().then(result => { return result });
    },
    getHumanToADMComparison: async (obj, args, context, info) => {
      return await context.db.collection('humanToADMComparison').find().toArray().then(result => { return result });
    },
    getCurrentSurveyVersion: async (obj, args, context, info) => {
      return await context.db.collection('surveyVersion').findOne().then(result => { return result.version });
    },
    getCurrentStyle: async (obj, args, context, info) => {
      return await context.db.collection('uiStyle').findOne().then(result => { return result.version })
    },
    getADMTextProbeMatches: async (obj, args, context, info) => {
      return await context.db.collection('admVsTextProbeMatches').find().toArray().then(result => { return result });
    },
    getMultiKdmaAnalysisData: async (obj, args, context, info) => {
      return await context.db.collection('multiKdmaData').find().toArray().then(result => { return result });
    },
    getMultiKdmaAnalysisDataEval11: async (obj, args, context, info) => {
      return await context.db.collection('multiKdmaData4Dtake2').find().toArray().then(result => { return result });
    },
    getCurrentTextEval: async (obj, args, context, info) => {
      const result = await context.db.collection('surveyVersion').findOne();
      return result ? result.textScenarios : null;
    },
    getTextEvalOptions: async (obj, args, context, info) => {
      const evals = await context.db.collection('textBasedConfig')
        .distinct('eval')
        .then(result => result.filter(evalId => evalId != null));
      return evals.sort();
    },
    getPidBounds: async (obj, args, context, info) => {
      const bounds = await context.db.collection('surveyVersion').findOne();
      return { lowPid: bounds.lowPid, highPid: bounds.highPid }
    },
    getShowDemographics: async (obj, args, context, info) => {
      const demographics = await context.db.collection('surveyVersion').findOne();
      return demographics.showDemographics;
    },
    getSurveyConfigByVersion: async (obj, args, context, inflow) => {
      const version = parseFloat(args.version);
      return await context.db.collection('delegationConfig')
        .find({ "survey.version": version })
        .toArray()
        .then(result => { return result; });
    },

    getTextBasedConfigByEval: async (obj, args, context, inflow) => {
      return await context.db.collection('textBasedConfig')
        .find({
          $or: [
            { "eval": args.evalName },
            // we need this demographics page loaded in either way
            { "name": "Post-Scenario Measures Phase 2" }
          ]
        })
        .toArray()
        .then(result => { return result; });
    }
  },
  Mutation: {
    updateAdminUser: async (obj, args, context, inflow) => {
      const session = await context.db.collection('sessions').find({ "_id": new ObjectId(args['caller']?.['sessionId']) })?.project({ "userId": 1, "valid": 1 }).toArray().then(result => { return result[0] });
      const user = await context.db.collection('users').find({ "username": args['caller']?.['username'] })?.project({ "_id": 1, "username": 1, "admin": 1 }).toArray().then(result => { return result[0] });
      if (session?.valid && (session?.userId == user?._id) && user?.admin) {
        return await context.db.collection('users').update(
          { "username": args["username"] },
          { $set: { "admin": args["isAdmin"] } }
        );
      }
      else {
        throw new GraphQLError('Users outside of the admin group cannot update administrator status.', {
          extensions: { code: '404' }
        });
      }
    },
    updateEvaluatorUser: async (obj, args, context, inflow) => {
      const session = await context.db.collection('sessions').find({ "_id": new ObjectId(args['caller']?.['sessionId']) })?.project({ "userId": 1, "valid": 1 }).toArray().then(result => { return result[0] });
      const user = await context.db.collection('users').find({ "username": args['caller']?.['username'] })?.project({ "_id": 1, "username": 1, "admin": 1 }).toArray().then(result => { return result[0] });
      if (session?.valid && (session?.userId == user?._id) && user?.admin) {
        return await context.db.collection('users').update(
          { "username": args["username"] },
          { $set: { "evaluator": args["isEvaluator"] } }
        );
      }
      else {
        throw new GraphQLError('Users outside of the admin group cannot update evaluator status.', {
          extensions: { code: '404' }
        });
      }
    },
    updateExperimenterUser: async (obj, args, context, inflow) => {
      const session = await context.db.collection('sessions').find({ "_id": new ObjectId(args['caller']?.['sessionId']) })?.project({ "userId": 1, "valid": 1 }).toArray().then(result => { return result[0] });
      const user = await context.db.collection('users').find({ "username": args['caller']?.['username'] })?.project({ "_id": 1, "username": 1, "admin": 1 }).toArray().then(result => { return result[0] });
      if (session?.valid && (session?.userId == user?._id) && user?.admin) {
        return await context.db.collection('users').update(
          { "username": args["username"] },
          { $set: { "experimenter": args["isExperimenter"] } }
        );
      }
      else {
        throw new GraphQLError('Users outside of the admin group cannot update experimenter status.', {
          extensions: { code: '404' }
        });
      }
    },
    updateAdeptUser: async (obj, args, context, inflow) => {
      const session = await context.db.collection('sessions').find({ "_id": new ObjectId(args['caller']?.['sessionId']) })?.project({ "userId": 1, "valid": 1 }).toArray().then(result => { return result[0] });
      const user = await context.db.collection('users').find({ "username": args['caller']?.['username'] })?.project({ "_id": 1, "username": 1, "admin": 1 }).toArray().then(result => { return result[0] });
      if (session?.valid && (session?.userId == user?._id) && user?.admin) {
        return await context.db.collection('users').update(
          { "username": args["username"] },
          { $set: { "adeptUser": args["isAdeptUser"] } }
        );
      }
      else {
        throw new GraphQLError('Users outside of the admin group cannot update ADEPT user status.', {
          extensions: { code: '404' }
        });
      }
    },
    updateUserApproval: async (obj, args, context, inflow) => {
      const session = await context.db.collection('sessions').find({ "_id": new ObjectId(args['caller']?.['sessionId']) })?.project({ "userId": 1, "valid": 1 }).toArray().then(result => { return result[0] });
      const user = await context.db.collection('users').find({ "username": args['caller']?.['username'] })?.project({ "_id": 1, "username": 1, "admin": 1 }).toArray().then(result => { return result[0] });
      if (session?.valid && (session?.userId == user?._id) && user?.admin) {
        return await context.db.collection('users').update(
          { "username": args["username"] },
          {
            $set: {
              "approved": args["isApproved"],
              "rejected": args["isRejected"],
              "adeptUser": args["isAdeptUser"],
              "experimenter": args["isExperimenter"],
              "evaluator": args["isEvaluator"],
              "admin": args["isAdmin"]
            }
          }
        );
      }
      else {
        throw new GraphQLError('Users outside of the admin group cannot approve new users.', {
          extensions: { code: '404' }
        });
      }
    },
    updateEvalData: async (obj, args, context, inflow) => {
      const session = await context.db.collection('sessions').find({ "_id": new ObjectId(args['caller']?.['sessionId']) })?.project({ "userId": 1, "valid": 1 }).toArray().then(result => { return result[0] });
      const user = await context.db.collection('users').find({ "username": args['caller']?.['username'] })?.project({ "_id": 1, "username": 1, "admin": 1 }).toArray().then(result => { return result[0] });
      if (session?.valid && (session?.userId == user?._id) && user?.admin) {
        const data = args['dataToUpdate'];
        return await context.db.collection('evalData').update(
          { "_id": new ObjectId(data["_id"]) },
          {
            $set: {
              "evalNumber": data['evalNumber'],
              "evalName": data['evalName'],
              "pages": {
                "rq1": data['pages']['rq1'],
                "rq2": data['pages']['rq2'],
                "rq3": data['pages']['rq3'],
                "exploratoryAnalysis": data['pages']['exploratoryAnalysis'],
                "admProbeResponses": data['pages']['admProbeResponses'],
                "admAlignment": data['pages']['admAlignment'],
                "admResults": data['pages']['admResults'],
                "humanSimPlayByPlay": data['pages']['humanSimPlayByPlay'],
                "humanSimProbes": data['pages']['humanSimProbes'],
                "participantLevelData": data['pages']['participantLevelData'],
                "textResults": data['pages']['textResults'],
                "programQuestions": data['pages']['programQuestions']
              }
            }
          }
        );
      }
      else {
        throw new GraphQLError('Users outside of the admin group cannot update evals.', {
          extensions: { code: '404' }
        });
      }
    },
    addNewEval: async (obj, args, context, inflow) => {
      const session = await context.db.collection('sessions').find({ "_id": new ObjectId(args['caller']?.['sessionId']) })?.project({ "userId": 1, "valid": 1 }).toArray().then(result => { return result[0] });
      const user = await context.db.collection('users').find({ "username": args['caller']?.['username'] })?.project({ "_id": 1, "username": 1, "admin": 1 }).toArray().then(result => { return result[0] });
      if (session?.valid && (session?.userId == user?._id) && user?.admin) {
        try {
          const result = await context.db.collection('evalData').insertOne(args.newEval);
          return result;
        } catch (error) {
          console.error(`INSERT ERROR:`, error);
          throw error;
        }
      }
      else {
        throw new GraphQLError('Users outside of the admin group cannot add evals.', {
          extensions: { code: '404' }
        });
      }
    },
    deleteEval: async (obj, args, context, inflow) => {
      const session = await context.db.collection('sessions').find({ "_id": new ObjectId(args['caller']?.['sessionId']) })?.project({ "userId": 1, "valid": 1 }).toArray().then(result => { return result[0] });
      const user = await context.db.collection('users').find({ "username": args['caller']?.['username'] })?.project({ "_id": 1, "username": 1, "admin": 1 }).toArray().then(result => { return result[0] });
      if (session?.valid && (session?.userId == user?._id) && user?.admin) {
        try {
          const result = await context.db.collection('evalData').deleteOne({ '_id': ObjectId(args['evalId']) });
          return result;
        } catch (error) {
          console.error(`DELETE ERROR:`, error);
          throw error;
        }
      }
      else {
        throw new GraphQLError('Users outside of the admin group cannot delete evals.', {
          extensions: { code: '404' }
        });
      }
    },
    uploadSurveyResults: async (obj, args, context, inflow) => {
      const filter = { surveyId: args.surveyId }
      const update = { $set: { results: args.results } }
      const options = { upsert: true }

      return await context.db.collection('surveyResults').updateOne(filter, update, options)
    },
    uploadScenarioResults: async (obj, args, context, inflow) => {
      const results = args.results
      for (const result of results) {
        if (result.participantID.toLowerCase().includes('test')) { continue }
        await context.db.collection('userScenarioResults').insertOne(result)
      }
    },
    updatePidBounds: async (obj, args, context, info) => {
      const res = await context.db.collection('surveyVersion').findOneAndUpdate(
        {},
        {
          $set: {
            lowPid: args.lowPid,
            highPid: args.highPid,
          }
        },
        { upsert: true, returnDocument: 'after' }
      )

      return res.value
    },
    updateShowDemographics: async (obj, args, context, info) => {
      const res = await context.db.collection('surveyVersion').findOneAndUpdate(
        {},
        {
          $set: {
            showDemographics: args.showDemographics
          }
        },
        { upsert: true, returnDocument: 'after' }
      )
      return res.value
    },
    addNewParticipantToLog: async (obj, args, context, inflow) => {
      try {
        const pidBounds = await context.db.collection('surveyVersion').findOne();
        const lowPid = pidBounds?.lowPid;
        const highPid = pidBounds?.highPid

        const timestamp = generateServerTimestamp();
        let generatedPid;
        if (!Number.isFinite(args.participantData.ParticipantID)) {
          console.log(`[${timestamp}] Invalid PID detected, querying for highest PID`);

          const highestPidDoc = await context.db.collection('participantLog')
            .find({
              ParticipantID: { $type: "number", $lt: highPid, $gte: lowPid }
            })
            .sort({ ParticipantID: -1 })
            .limit(1)
            .toArray();

          generatedPid = highestPidDoc.length > 0 ? Number(highestPidDoc[0].ParticipantID) + 1 : lowPid;

          args.participantData.ParticipantID = generatedPid;
        } else {
          generatedPid = args.participantData.ParticipantID
        }

        // try to insert with our validated PID
        try {
          args.participantData.timestamp = timestamp;
          const result = await context.db.collection('participantLog').insertOne(args.participantData);
          console.log(`[${timestamp}] Insert SUCCESS for PID: ${args.participantData.ParticipantID}`);
          return { ...result, generatedPid };
        } catch (error) {
          if (error.code === 11000) { // ff we hit a duplicate
            console.log(`[${timestamp}] DUPLICATE KEY ERROR for PID: ${args.participantData.ParticipantID}`);
            console.log(`[${timestamp}] Retrying with new PID generation`);

            // get absolute latest highest PID
            const highestPidDoc = await context.db.collection('participantLog')
              .find({
                ParticipantID: { $type: "number", $lt: highPid, $gte: lowPid }
              })
              .sort({ ParticipantID: -1 })
              .limit(1)
              .toArray();

            const retryPid = Number(highestPidDoc[0].ParticipantID) + 1;
            console.log(`[${timestamp}] New retry PID generated: ${retryPid}`);

            args.participantData.ParticipantID = retryPid;

            console.log(`[${timestamp}] Attempting final insert with PID: ${retryPid}`);
            const retryResult = await context.db.collection('participantLog')
              .insertOne(args.participantData);
            console.log(`[${timestamp}] Retry insert SUCCESS for PID: ${retryPid}`);
            return retryResult;
          }
          console.error(`[${timestamp}] NON-DUPLICATE ERROR:`, error);
          throw error;
        }
      } catch (error) {
        const timestamp = generateServerTimestamp()
        console.error(`[${timestamp}] CRITICAL ERROR in addNewParticipantToLog:`, error);
        if (error.code === 11000) {
          return -1;
        }
        else {
          throw error;
        }

      }
    },
    updateSurveyVersion: async (obj, args, context, inflow) => {
      const result = await context.db.collection('surveyVersion').findOneAndUpdate(
        {},
        { $set: { version: args['version'] } },
        { upsert: true }
      );
      return result.value.version;
    },
    updateUIStyle: async (obj, args, context, inflow) => {
      const result = await context.db.collection('uiStyle').findOneAndUpdate(
        {},
        { $set: { version: args['version'] } },
        { upsert: true }
      )
      return result.value.version
    },
    updateParticipantLog: async (obj, args, context, inflow) => {
      return await context.db.collection('participantLog').update(
        { "ParticipantID": Number(args["pid"]) },
        { $set: args["updates"] }
      );
    },
    getServerTimestamp: async () => {
      return generateServerTimestamp();
    },
    updateTextEval: async (obj, args, context, info) => {
      const result = await context.db.collection('surveyVersion').findOneAndUpdate(
        {},
        { $set: { textScenarios: args.eval } },
        { upsert: true, returnDocument: 'after' }
      );
      return result.value.textScenarios;
    },
    deleteDataByPID: async (obj, args, context, inflow) => {
      const accessToken = args['caller']?.['tokens']?.['accessToken'];
      if (!accessToken) {
        throw new GraphQLError('Invalid Access Token.', {
          extensions: { code: '400' }
        });
      }
      const sessionToken = jwt.decode(accessToken)?.data?.token;
      if (!sessionToken) {
        throw new GraphQLError('Invalid Access Token.', {
          extensions: { code: '400' }
        });
      }
      const session = await context.db.collection('sessions').find({ "token": sessionToken })?.project({ "userId": 1, "valid": 1 }).toArray().then(result => { return result[0] });
      const user = await context.db.collection('users').find({ "username": args['caller']?.['user']?.['username'] })?.project({ "_id": 1, "username": 1, "admin": 1 }).toArray().then(result => { return result[0] });
      if (session?.valid && (session?.userId == user?._id) && user?.admin) {
        const foundPlog = await context.db.collection('participantLog').find({ 'ParticipantID': Number(args['pid']) }).toArray();
        const foundText = await context.db.collection('userScenarioResults').find({ 'participantID': args['pid'] }).toArray();
        const foundSurvey = await context.db.collection('surveyResults').find({ 'results.Participant ID Page.questions.Participant ID.response': args['pid'] }).toArray();
        const oldEnough = (milliseconds) => {
          if (isNaN(milliseconds)) {
            return true;
          }
          return (milliseconds / (1000 * 60 * 60)) >= 24;
        };
        const now = new Date();
        const allOldEnough = true;

        // check that pid was created at least 24 hours ago
        for (const doc of foundPlog) {
          if (!doc['timeCreated']) {
            continue;
          }
          const plogDate = new Date(doc['timeCreated']);
          const timeSincePID = now - plogDate;
          if (!oldEnough(timeSincePID)) {
            allOldEnough = false;
            break;
          }
        }

        // check that text ended 24 hours ago OR if incomplete, was started 24 hours ago
        for (const doc of foundText) {
          let timeToCheck = doc.timeComplete;
          if (!timeToCheck) {
            timeToCheck = doc.startTime;
          }
          const timeSinceText = now - Date(timeToCheck);
          if (!oldEnough(timeSinceText)) {
            allOldEnough = false;
            break;
          }
        }

        // check that survey ended 24 hours ago OR if incomplete, was started 24 hours ago
        for (const doc of foundSurvey) {
          if (!doc.results) {
            continue;
          }
          let timeToCheck = doc.results.timeComplete;
          if (!timeToCheck) {
            timeToCheck = doc.results.startTime;
          }
          const timeSinceText = now - Date(timeToCheck);
          if (!oldEnough(timeSinceText)) {
            allOldEnough = false;
            break;
          }
        }


        if (!allOldEnough) {
          throw new GraphQLError('Data is not yet 24 hours old. Please wait to delete.', {
            extensions: { code: '400' }
          });
        }

        const plogRes = await context.db.collection('participantLog').deleteMany({ 'ParticipantID': Number(args['pid']) });
        const textRes = await context.db.collection('userScenarioResults').deleteMany({ 'participantID': args['pid'] });
        const surveyRes = await context.db.collection('surveyResults').deleteMany({ 'results.Participant ID Page.questions.Participant ID.response': args['pid'] });
        const rawSimRes = await context.db.collection('humanSimulatorRaw').deleteMany({ 'pid': args['pid'] });
        const analyzedSimRes = await context.db.collection('humanSimulator').deleteMany({ 'pid': args['pid'] });
        return { plogRes, textRes, surveyRes, rawSimRes, analyzedSimRes };
      }
      else {
        throw new GraphQLError('Users outside of the admin group cannot delete participant data.', {
          extensions: { code: '404' }
        });
      }
    },
  },
  StringOrFloat: new GraphQLScalarType({
    name: "StringOrFloat",
    description: "A String or a Float union type",
    serialize(value) {
      if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
        throw new Error("Value must be either a String, Boolean, or an Int");
      }

      return value;
    },
    parseValue(value) {
      if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
        throw new Error("Value must be either a String, Boolean, or an Int");
      }

      return value;
    },
    parseLiteral(ast) {
      switch (ast.kind) {
        case Kind.FLOAT: return parseFloat(ast.value);
        case Kind.STRING: return ast.value;
        case Kind.BOOLEAN: return ast.value;
        default:
          throw new Error("Value must be either a String, Boolean, or a Float");
      }
    }
  })
};

module.exports = {
  typeDefs,
  resolvers
};