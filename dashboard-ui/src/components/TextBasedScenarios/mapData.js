const { MongoClient } = require('mongodb');
const process = require('process');
const { mapAnswers, addProbeIDs, getAdeptAlignment, getSoarTechAlignments } = require('./util');
const stJungleConfig = require('./stJungleConfig.json');
const stUrbanConfig = require('./stUrbanConfig.json');
const stDesertConfig = require('./stDesertConfig.json');
const stSubConfig = require('./stSubConfig.json');
const adeptJungleConfig = require('./adeptJungleConfig.json');
const adeptUrbanConfig = require('./adeptUrbanConfig.json');
const adeptDesertConfig = require('./adeptDesertConfig.json');
const adeptSubConfig = require('./adeptSubConfig.json');

// mappings to config files
const scenarioMappings = {
    "SoarTech Jungle": stJungleConfig,
    "SoarTech Urban": stUrbanConfig,
    "SoarTech Desert": stDesertConfig,
    "SoarTech Submarine": stSubConfig,
    "Adept Jungle": adeptJungleConfig,
    "Adept Urban": adeptUrbanConfig,
    "Adept Desert": adeptDesertConfig,
    "Adept Submarine": adeptSubConfig
}

// titles attached to data to proper scenario id for server
const scenarioNameToID = {
    "Adept Submarine": "MetricsEval.MD6-Submarine",
    "Adept Desert": "MetricsEval.MD5-Desert",
    "Adept Urban": "MetricsEval.MD1-Urban",
    "Adept Jungle": "MetricsEval.MD4-Jungle",
    "SoarTech Urban": "urban-1",
    "SoarTech Submarine": "submarine-1",
    "SoarTech Desert": "desert-1",
    "SoarTech Jungle": "jungle-1"
}

// mongo credentials
const username = process.argv[2];
const password = process.argv[3];

// Check if username and password were provided
if (!username || !password) {
  console.log('Error: Username and password must be provided as command-line arguments.');
  process.exit(1);
}

const connectionString = `mongodb://${username}:${password}@127.0.0.1:27030/?authSource=dashboard`;
const client = new MongoClient(connectionString);
async function run() {
  try {
    // grab scenario results array
    await client.connect();
    const db = client.db('dashboard');
    const collection = db.collection('userScenarioResults');
    const results = await collection.find({}).toArray();
    for (const result of results) {
        if (!result.participantID) { continue; }
        
        // attaches probeID's to results
        addProbeIDs(result, scenarioMappings);
        // attach choice id's to results
        mapAnswers(result, scenarioMappings);

        // get alignment scores
        if (result.title.includes("Adept")) {
            await getAdeptAlignment(result, scenarioNameToID[result.title]);
        } else if (result.title.includes("SoarTech")) {
            await getSoarTechAlignments(result, scenarioNameToID[result.title]);
        } else {
            console.log('Error: unrecognized scenario title');
            process.exit(1);
        }
        // update mongo document
        await collection.updateOne(
            { _id: result._id },
            { $set: result }
        );
    }
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
