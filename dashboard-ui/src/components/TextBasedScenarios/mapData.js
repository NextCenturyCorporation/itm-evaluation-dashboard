const { MongoClient } = require('mongodb');
const process = require('process');
const { mapAnswers, addProbeIDs } = require('./util');
const stJungleConfig = require('./stJungleConfig.json');
const stUrbanConfig = require('./stUrbanConfig.json');
const stDesertConfig = require('./stDesertConfig.json');
const stSubConfig = require('./stSubConfig.json');
const adeptJungleConfig = require('./adeptJungleConfig.json');
const adeptUrbanConfig = require('./adeptUrbanConfig.json');
const adeptDesertConfig = require('./adeptDesertConfig.json');
const adeptSubConfig = require('./adeptSubConfig.json');
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
const username = process.argv[2];
const password = process.argv[3];

// Check if username and password were provided
if (!username || !password) {
  console.log('Error: Username and password must be provided as command-line arguments.');
  process.exit(1);
}

const connectionString = `mongodb://${username}:${password}@localhost:27017/?authSource=dashboard`;
const client = new MongoClient(connectionString);
async function run() {
  try {
    // grab scenario results array
    await client.connect();
    const db = client.db('dashboard');
    const collection = db.collection('userScenarioResults');
    const results = await collection.find({}).toArray();
    for (const result of results) {
        addProbeIDs(result, scenarioMappings);
        mapAnswers(result, scenarioMappings);
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
