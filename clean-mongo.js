// emails of people who have populated test data
const query = {
    "$or": [
        {
            // newer format email addresses
            "results.user.emails.address": {
                $in: [
                    "dereknop@gmail.com",
                    "jennifer.mcvay@caci.com",
                    "ewartdevisser@gmail.com",
                    "kaitlyn.sharo@caci.com",
                    "derek.noppinger@caci.com",
                    "darpaitm@gmail.com"
                ]
            }
        },
        {
            // old survey results (only the orignal version from qualtrics have this field)
            "Team": { $exists: true }
        },
        {
            // old format email addresses
            "user.currentUser.emails.address": {
                $in: [
                    "dereknop@gmail.com",
                    "darpaitm@gmail.com",
                    "jennifer.mcvay@caci.com",
                    "ewartdevisser@gmail.com",
                    "kaitlyn.sharo@caci.com",
                    "derek.noppinger@caci.com"
                ]
            }
        },
        { 
            "results.Participant ID.questions.Participant ID.response": { 
                "$regex": /test/i 
            } 
        }
    ]
};

// select dashboard db
db = db.getSiblingDB('dashboard')

// delete all matches
db.surveyResults.deleteMany(query);

