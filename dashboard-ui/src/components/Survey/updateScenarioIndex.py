from pymongo import MongoClient

uri = "mongodb://simplemongousername:simplemongopassword@localhost:27030/?authSource=dashboard"

client = MongoClient(uri)

db = client.dashboard
collection = db.surveyResults


collection.update_many(
    {"results.Omnibus: Medic-A vs Medic-B": {"$exists": True}},
    {"$set": {"results.Omnibus: Medic-A vs Medic-B.scenarioIndex": 9}}
)

collection.update_many(
    {"results.Omnibus: Medic-C vs Medic-D": {"$exists": True}},
    {"$set": {"results.Omnibus: Medic-C vs Medic-D.scenarioIndex": 10}}
)

print("Updates completed successfully.")

client.close()
