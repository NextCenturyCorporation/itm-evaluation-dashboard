const { gql } = require('apollo-server');
const { dashboardDB } = require('./server.mongo');
// const mongoDb = require("mongodb");
// const { MONGO_DB } = require('./config');
const { GraphQLScalarType, Kind } = require("graphql");

const typeDefs = gql`
  scalar JSON

  scalar StringOrFloat

  scalar ThreatsDict

  extend input CreateUserInput {
    admin: Boolean
  }

  extend type User {
    admin: Boolean
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
    getHistory(id: ID): JSON
    getAllHistory(id: ID): [JSON]
    getAllHistoryByID(historyId: ID): JSON
    getScenario(scenarioId: ID): JSON
    getScenarioNames: [JSON]
    getScenarioNamesByEval(evalNumber: Float): [JSON]
    getPerformerADMsForScenario(admQueryStr: String, scenarioID: ID): JSON
    getTestByADMandScenario(admQueryStr: String, scenarioID: ID, admName: ID): JSON
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
    getAllScenarioResults: [JSON],
    getAllSimAlignment: [JSON],
    getEvalNameNumbers: [JSON],
    getAllRawSimData: [JSON]
  }

  type Mutation {
    updateAdminUser(username: String, isAdmin: Boolean): JSON
    uploadSurveyResults(surveyId: String, results: JSON): JSON
    uploadScenarioResults(results: [JSON]): JSON
  }
`;

const resolvers = {
  Query: {
    getHistory: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('test').findOne(args).then(result => { return result; });
    },
    getAllHistory: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('test').find().toArray().then(result => { return result; });
    },
    getAllHistoryByID: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('test').find({ "history.response.id": args.historyId }).toArray().then(result => { return result; });
    },
    getScenario: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('scenarios').findOne({ "id": args["scenarioId"] }).then(result => { return result; });
    },
    getScenarioNames: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('scenarios').aggregate([{ $group: { _id: { "id": '$id', "name": '$name' } } }])
        .toArray().then(result => { return result });
    },
    getScenarioNamesByEval: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('scenarios').aggregate([{$match: {"evalNumber": args["evalNumber"]}},{ $group: { _id: { "id": '$id', "name": '$name' } } }])
        .toArray().then(result => { return result });
    },
    getPerformerADMsForScenario: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('test').distinct(args["admQueryStr"], { "history.response.id": args["scenarioID"] }).then(result => { return result });
    },
    getTestByADMandScenario: async (obj, args, context, inflow) => {
      let queryObj = {};
      queryObj[args["admQueryStr"]] = args["admName"];
      queryObj["history.response.id"] = args["scenarioID"];

      return await dashboardDB.db.collection('test').findOne(queryObj).then(result => { return result });
    },
    getAllScenarios: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('scenarios').find().toArray().then(result => { return result; });
    },
    getScenarioState: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('scenarioStates').findOne(args).then(result => { return result; });
    },
    getAllScenarioStates: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('scenarioStates').find().toArray().then(result => { return result; });
    },
    getProbe: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('probes').findOne(args).then(result => { return result; });
    },
    getAllProbes: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('probes').find().toArray().then(result => { return result; });
    },
    getPatient: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('patients').findOne(args).then(result => { return result; });
    },
    getAllPatients: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('patients').find().toArray().then(result => { return result; });
    },
    getInjury: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('injuries').findOne(args).then(result => { return result; });
    },
    getAllInjuries: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('injuries').find().toArray().then(result => { return result; });
    },
    getVitals: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('vitals').findOne(args).then(result => { return result; });
    },
    getAllVitals: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('vitals').find().toArray().then(result => { return result; });
    },
    getTriageCategory: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('triageCategories').findOne(args).then(result => { return result; });
    },
    getAllTriageCategories: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('triageCategories').find().toArray().then(result => { return result; });
    },
    getSupply: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('medicalSupplies').findOne(args).then(result => { return result; });
    },
    getAllSupplies: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('medicalSupplies').find().toArray().then(result => { return result; });
    },
    getAllHumanRuns: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('humanRuns').find({ "runId": { $exists: true } }).toArray().then(result => { return result; });
    },
    getAllImages: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('humanRuns').find({ "bytes": { $exists: true } }).toArray().then(result => { return result; });
    },
    getAllSurveyResults: async (obj, args, context, inflow) => {
      // return all survey results except for those containing "test" in participant ID
      return await dashboardDB.db.collection('surveyResults').find({
        "results.Participant ID.questions.Participant ID.response": { $not: /test/i },
        "results.Participant ID Page.questions.Participant ID.response": { $not: /test/i },
        "Participant ID.questions.Participant ID.response": { $not: /test/i },
        "Participant ID Page.questions.Participant ID.response": { $not: /test/i }
      }).toArray().then(result => { return result; });
    },
    getAllScenarioResults: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('userScenarioResults').find({
        "participantID": { $not: /test/i }
      }).toArray().then(result => { return result; });
    },
    getAllSimAlignment: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('humanSimulator').find().toArray().then(result => { return result; });
    },
    getEvalNameNumbers: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('test').aggregate( 
        [{"$group": {"_id": {evalNumber: "$evalNumber", evalName: "$evalName"}}}]).toArray().then(result => {return result});
    },
    getAllRawSimData: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('humanSimulatorRaw').find().toArray().then(result => { return result; });
    },
  },
  Mutation: {
    updateAdminUser: async (obj, args, context, inflow) => {
      return await dashboardDB.db.collection('users').update(
        { "username": args["username"] },
        { $set: { "admin": args["isAdmin"] } }
      );
    },
    uploadSurveyResults: async (obj, args, context, inflow) => {
      const filter = { surveyId: args.surveyId}
      const update = { $set: {results: args.results}}
      const options = { upsert: true}

      return await dashboardDB.db.collection('surveyResults').updateOne(filter, update, options)
    },
    uploadScenarioResults: async (obj, args, context, inflow) => {
      const results = args.results
      for (const result of results) {
        if (result.participantID.toLowerCase().includes('test')) { continue }
        await dashboardDB.db.collection('userScenarioResults').insertOne(result)
      }
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
