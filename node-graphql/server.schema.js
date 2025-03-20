const { gql } = require('apollo-server');
const { ObjectId } = require('mongodb');
const { GraphQLScalarType, Kind, GraphQLError } = require("graphql");

const typeDefs = gql`
  scalar JSON

  scalar StringOrFloat

  scalar ThreatsDict

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

  type Player {
    firstName: String,
    lastName: String
  }

  type Scenario {
    id: ID
    name: String
    startTime: String
    state: State
    triage_categories: [TriageCategory]
  }


  type State {
    unstructured: String
    elapsedTime: Float
    scenario_complete: Boolean
    mission: Mission
    environment: Environment
    threat_state: ThreatState
    supplies: [Supplies]
    casualties: [Casualty]
  }

  type Mission {
    unstructured: String
    mission_type: MissionType
  }

  type Environment {
    unstructured: String
    aidDelay: Float
    weather: String
    location: String
    visibility: Float
    noise_ambient: Float
    noise_peak: Float
  }

  type ThreatState {
    unstructured: String
    threats: ThreatsDict
  }

  type Probe {
    id: ID
    question: String
    patient_ids: [String]
  }

  type Casualty {
    id: ID
    unstructured: String
    name: String
    demographics: Demographics
    injuries: [Injury]
    vitals: Vitals
    mental_status: MentalStatus
    assessed: Boolean
    tag: TriageTag
  }

  type Demographics {
    age: Int
    sex: Sex
    rank: Rank
  }

  type Injury {
    name: String
    location: String
    severity: Float
  }

  type Vitals {
    hrpmin: Int
    mm_hg: Int
    rr: Int
    sp_o2: Int
    pain: Int
  }

  type TriageCategory {
    tagLabel: TriageTag
    description: String
    criteria: String
  }

  type Supplies {
    type: String
    quantity: Int
  }

  enum Sex {
    M
    F
    unknown
  }

  enum Rank {
    Military
    Enemy
    Civilian
    VIP
  }

  enum MentalStatus {
    calm
    confused
    upset
    agony
    unresponsive
  }

  enum TriageTag {
    none
    minimal
    delayed
    immediate
    expectant
    deceased
  }

  enum MissionType {
    ProtectVIP
    ProtectCivilians
    DeliverCargo
    DefendBase
  }

  type Query {
    getUsers: JSON
    checkUserExists(email: String!, username: String!): Boolean!
    getHistory(id: ID): JSON
    getAllHistory(id: ID): [JSON]
    getAllHistoryByEvalNumber(evalNumber: Float, showMainPage: Boolean): [JSON],
    getGroupAdmAlignmentByEval(evalNumber: Float): [JSON],
    getEvalIds: [JSON],
    getEvalIdsForAllHistory: [JSON],
    getAllHistoryByID(historyId: ID): JSON
    getScenario(scenarioId: ID): JSON
    getScenarioNames: [JSON]
    getScenarioNamesByEval(evalNumber: Float): [JSON]
    getPerformerADMsForScenario(admQueryStr: String, scenarioID: ID): JSON,
    getAlignmentTargetsPerScenario(evalNumber: Float, scenarioID: ID): JSON,
    getTestByADMandScenario(admQueryStr: String, scenarioID: ID, admName: ID, alignmentTarget: String, evalNumber: Int): JSON
    getAllTestDataForADM(admQueryStr: String, scenarioID: ID, admName: ID, alignmentTargets: [String], evalNumber: Int): [JSON]
    getAllScenarios(id: ID): [Scenario]
    getScenarioState(id: ID): State
    getAllScenarioStates: [State]
    getProbe(id: ID): Probe
    getAllProbes: [Probe]
    getPatient(id: ID): Casualty
    getAllPatients: [Casualty]
    getInjury(id: ID): Injury
    getAllInjuries: [Injury]
    getVitals(id: ID): Vitals
    getAllVitals: [Vitals]
    getTriageCategory(id: ID): TriageCategory
    getAllTriageCategories: [TriageCategory]
    getSupply(id: ID): Supplies
    getAllSupplies: [Supplies]
    getAllHumanRuns: [JSON]
    getAllImages: [JSON],
    getAllSurveyResults: [JSON],
    getAllSurveyResultsByEval(evalNumber: Float): [JSON],
    getAllScenarioResults: [JSON],
    getAllScenarioResultsByEval(evalNumber: Float): [JSON],
    getAllTextScenariosDRE: [JSON],
    getEvalIdsForAllScenarioResults: [JSON],
    getAllSimAlignment: [JSON],
    getAllSimAlignmentByEval(evalNumber: Float): [JSON],
    getEvalIdsForSimAlignment: [JSON],
    getEvalNameNumbers: [JSON],
    getEvalIdsForHumanResults: [JSON],
    getAllRawSimData: [JSON],
    getAllSurveyConfigs: [JSON],
    getAllTextBasedConfigs: [JSON],
    getAllImageUrls: [JSON],
    getAllTextBasedImages: [JSON],
    countHumanGroupFirst: Int,
    countAIGroupFirst: Int,
    getParticipantLog: [JSON],
    getHumanToADMComparison: [JSON],
    getCurrentSurveyVersion: String,
    getADMTextProbeMatches: [JSON]
  }

  type Mutation {
    updateAdminUser(caller: JSON, username: String, isAdmin: Boolean): JSON,
    updateEvaluatorUser(caller: JSON, username: String, isEvaluator: Boolean): JSON,
    updateExperimenterUser(caller: JSON, username: String, isExperimenter: Boolean): JSON,
    updateAdeptUser(caller: JSON, username: String, isAdeptUser: Boolean): JSON,
    updateUserApproval(caller: JSON, username: String, isApproved: Boolean, isRejected: Boolean, isAdmin: Boolean, isEvaluator: Boolean, isExperimenter: Boolean, isAdeptUser: Boolean): JSON,
    uploadSurveyResults(surveyId: String, results: JSON): JSON,
    uploadScenarioResults(results: [JSON]): JSON,
    addNewParticipantToLog(participantData: JSON, lowPid: Int, highPid: Int): JSON,
    updateEvalIdsByPage(evalNumber: Int, field: String, value: Boolean): JSON,
    updateSurveyVersion(version: String!): String,
    updateParticipantLog(pid: String, updates: JSON): JSON
    getServerTimestamp: String
  }
`;

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
      return await context.db.collection('admTargetRuns').find({ "evalNumber": args["evalNumber"] }, {
        projection: {
          "history.parameters.adm_name": 1,
          "history.response.id": 1,
          "history.parameters.target_id": 1,
          "history.response.kdma_values.value": 1,
          "history.parameters.target_id": 1,
          "history.response.score": 1,
          "history.response.dre_alignment.score": 1,
          "history.parameters.session_id": 1,
          "history.parameters.dreSessionId": 1,
          "history.command": 1
        }
      }).toArray().then(result => { return result; });
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
    getEvalIds: async (obj, args, context, inflow) => {
      return await context.db.collection('evaluationIDS').find().toArray().then(result => { return result; });
    },
    getEvalIdsForAllHistory: async (obj, args, context, inflow) => {
      return await context.db.collection('admTargetRuns').aggregate(
        [{ "$group": { "_id": { evalNumber: "$evalNumber", evalName: "$evalName" } } }]).sort({ 'evalNumber': -1 }).toArray().then(result => { return result });
    },
    getAllHistoryByID: async (obj, args, context, inflow) => {
      return await context.db.collection('admTargetRuns').find({ "history.response.id": args.historyId }, { projection: { "history.parameters.adm_name": 1, "history.response.score": 1, "evalNumber": 1 } }).toArray().then(result => { return result; });
    },
    getScenario: async (obj, args, context, inflow) => {
      return await context.db.collection('scenarios').findOne({ "id": args["scenarioId"] }).then(result => { return result; });
    },
    getScenarioNames: async (obj, args, context, inflow) => {
      return await context.db.collection('scenarios').aggregate([{ $group: { _id: { "id": '$id', "name": '$name' } } }])
        .toArray().then(result => { return result });
    },
    getScenarioNamesByEval: async (obj, args, context, inflow) => {
      return await context.db.collection('scenarios').aggregate([{ $match: { "evalNumber": args["evalNumber"] } }, { $group: { _id: { "id": '$id', "name": '$name' } } }])
        .toArray().then(result => { return result });
    },
    getPerformerADMsForScenario: async (obj, args, context, inflow) => {
      return await context.db.collection('admTargetRuns').distinct(args["admQueryStr"], { "history.response.id": args["scenarioID"] }).then(result => { return result });
    },
    getAlignmentTargetsPerScenario: async (obj, args, context, inflow) => {
      let alignmentTargets = await context.db.collection('admTargetRuns').distinct("history.response.id", { "history.response.id": args["scenarioID"], "evalNumber": args["evalNumber"] }).then(result => { return result });
      // The scenarioID still comes back in this distinct because of the way the JSON is configured, remove it before sending the array
      const indexOfScenario = alignmentTargets.indexOf(args["scenarioID"]);
      alignmentTargets.splice(indexOfScenario, 1);
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
            { "history.response.id": args["alignmentTarget"] },
            { "history.response.id": args["scenarioID"] }
          ]
        };

        if (args["evalNumber"]) {
          queryObj.$and.push({ "evalNumber": args["evalNumber"] });
        }

        queryObj[args["admQueryStr"]] = args["admName"];
      }

      return await context.db.collection('admTargetRuns').findOne(queryObj).then(result => { return result });
    },
    getAllTestDataForADM: async (obj, args, context, inflow) => {
      const results = [];

      for (const target of args.alignmentTargets) {
        let queryObj = {
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

        const result = await context.db.collection('admTargetRuns')
          .findOne(queryObj)
          .then(result => result);

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
    getScenarioState: async (obj, args, context, inflow) => {
      return await context.db.collection('scenarioStates').findOne(args).then(result => { return result; });
    },
    getAllScenarioStates: async (obj, args, context, inflow) => {
      return await context.db.collection('scenarioStates').find().toArray().then(result => { return result; });
    },
    getProbe: async (obj, args, context, inflow) => {
      return await context.db.collection('probes').findOne(args).then(result => { return result; });
    },
    getAllProbes: async (obj, args, context, inflow) => {
      return await context.db.collection('probes').find().toArray().then(result => { return result; });
    },
    getPatient: async (obj, args, context, inflow) => {
      return await context.db.collection('patients').findOne(args).then(result => { return result; });
    },
    getAllPatients: async (obj, args, context, inflow) => {
      return await context.db.collection('patients').find().toArray().then(result => { return result; });
    },
    getInjury: async (obj, args, context, inflow) => {
      return await context.db.collection('injuries').findOne(args).then(result => { return result; });
    },
    getAllInjuries: async (obj, args, context, inflow) => {
      return await context.db.collection('injuries').find().toArray().then(result => { return result; });
    },
    getVitals: async (obj, args, context, inflow) => {
      return await context.db.collection('vitals').findOne(args).then(result => { return result; });
    },
    getAllVitals: async (obj, args, context, inflow) => {
      return await context.db.collection('vitals').find().toArray().then(result => { return result; });
    },
    getTriageCategory: async (obj, args, context, inflow) => {
      return await context.db.collection('triageCategories').findOne(args).then(result => { return result; });
    },
    getAllTriageCategories: async (obj, args, context, inflow) => {
      return await context.db.collection('triageCategories').find().toArray().then(result => { return result; });
    },
    getSupply: async (obj, args, context, inflow) => {
      return await context.db.collection('medicalSupplies').findOne(args).then(result => { return result; });
    },
    getAllSupplies: async (obj, args, context, inflow) => {
      return await context.db.collection('medicalSupplies').find().toArray().then(result => { return result; });
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

      }).toArray().then(result => { return result; });
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
      return await context.db.collection('users').find().project({ "services": 0, "createdAt": 0, "updatedAt": 0 }).toArray().then(result => { return result });
    },
    getAllSurveyConfigs: async (obj, args, context, inflow) => {
      return await context.db.collection('delegationConfig').find().toArray().then(result => { return result; });
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
    getADMTextProbeMatches: async (obj, args, context, info) => {
      return await context.db.collection('admVsTextProbeMatches').find().toArray().then(result => { return result });
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
    addNewParticipantToLog: async (obj, args, context, inflow) => {
      try {
        const timestamp = new Date().toISOString();

        if (!Number.isFinite(args.participantData.ParticipantID)) {
          console.log(`[${timestamp}] Invalid PID detected, querying for highest PID`);

          const highestPidDoc = await context.db.collection('participantLog')
            .find({
              ParticipantID: { $type: "number", $lt: args.highPid, $gte: args.lowPid }
            })
            .sort({ ParticipantID: -1 })
            .limit(1)
            .toArray();

          const nextPid = highestPidDoc.length > 0 ? Number(highestPidDoc[0].ParticipantID) + 1 : args.lowPid;

          args.participantData.ParticipantID = nextPid;
        }

        // try to insert with our validated PID
        try {
          const result = await context.db.collection('participantLog').insertOne(args.participantData);
          console.log(`[${timestamp}] Insert SUCCESS for PID: ${args.participantData.ParticipantID}`);
          return result;
        } catch (error) {
          if (error.code === 11000) { // ff we hit a duplicate
            console.log(`[${timestamp}] DUPLICATE KEY ERROR for PID: ${args.participantData.ParticipantID}`);
            console.log(`[${timestamp}] Retrying with new PID generation`);

            // get absolute latest highest PID
            const highestPidDoc = await context.db.collection('participantLog')
              .find({
                ParticipantID: { $type: "number", $lt: args.highPid, $gte: args.lowPid }
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
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] CRITICAL ERROR in addNewParticipantToLog:`, error);
        if (error.code === 11000) {
          return -1;
        }
        else {
          throw error;
        }

      }
    },
    updateEvalIdsByPage: async (obj, args, context, inflow) => {
      // hmm can't do this with graphql?      
      // var field = args["field"];
      // var updateObj = {};
      // updateObj[field] = args["value"]};

      const filter = { evalNumber: args["evalNumber"] }
      const update = { $set: { "showMainPage": args["value"] } }
      const options = { upsert: true }

      return await context.db.collection('evaluationIDS').updateOne(filter, update, options)
    },
    updateSurveyVersion: async (obj, args, context, inflow) => {
      const result = await context.db.collection('surveyVersion').findOneAndUpdate(
        {},
        { $set: { version: args['version'] } },
        { upsert: true }
      );
      return result.value.version;
    },
    updateParticipantLog: async (obj, args, context, inflow) => {
      return await context.db.collection('participantLog').update(
        { "ParticipantID": Number(args["pid"]) },
        { $set: args["updates"] }
      );
    },
    getServerTimestamp: async () => {
      process.env.TZ = 'America/New_York';
      const date = new Date();
      
      const januaryOffset = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
      const currentOffset = date.getTimezoneOffset();
      const isDST = currentOffset < januaryOffset;
      
      return `${date.toString().replace(/GMT-0[45]00 \(Eastern (Daylight|Standard) Time\)/, isDST ? 'GMT-0400 (Eastern Daylight Time)' : 'GMT-0500 (Eastern Standard Time)')}`;
    }

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
