# dashboard-app
UI Applications. 

# Running from Docker

```
docker build --tag dashboard-graphql node-graphql/.
docker build --tag dashboard-ui dashboard-ui/.

cd docker_setup
docker-compose -f docker-compose-dev.yml up -d

- On Production use this command:
docker-compose up -d
```

# Helpful Script to Rebuild UI

To rebuild only the dashboard-ui after making edits in that directory, from the base `itm_dashboard` directory run:

For Production
```
bash startup-scripts/dashboard_ui.sh
```

For Development
```
bash starup-scripts/dev_dashboard_ui.sh
```

# Helpful Script to Rebuild Graphql and UI

If you made changes to the node-graphql then from the base `itm_dashboard` directory run:

For Production
```
bash startup-scripts/graphql_dashboard_ui.sh
```

For Development
```
bash starup-scripts/dev_graphql_dashboard_ui.sh
```

# Populate MongoDB with Backup
When you build the dashboard-mongo container for the first time, it will be empty. Follow these steps to populate it:

1. Navigate to AWS and download backup.tar.gz from s3 bucket (dashboard-assets/mongodb-backups)
2. Uncompress the file
```
tar -xzvf backup.tar.gz
```
3. Import data into MongoDB
```
mongorestore --uri="mongodb://<INSERT_MONGO_USERNAME>:<INSERT_MONGO_PASSWORD>@localhost:27017/?authSource=dashboard" backup 
```

# Running Without Docker
1. One time step: Install mongo locally [setup docs](https://www.mongodb.com/docs/manual/administration/install-community/)
1. Once you have mongo installed, start the server with `mongod`
1. In node-graphql/server.mongo.js, replace the code starting on line 23 what's below: 
```
const connection = mongoose.connect('mongodb://localhost:27017/dashboard', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
    })
    .then(res => console.log( 'Database Connected' ))
    .catch(err => console.log( err.message, err ));
```
**Do NOT commit this code!** There is probably a better way to set up mongo locally, but I'm not yet sure what it is
1. Follow the instructions to populate mongodb with backup, but use 
    ```
    mongorestore --uri="mongodb://localhost:27017/" backup 
    ```
2. Use a node manager tool (such as [nvm](https://github.com/nvm-sh/nvm)) to install/use node version 12. ```nvm install 12``` or ```nvm use 12```
3. Copy a required configuration file to the node directory
    ```
    cp dashboard-ui/public/configs/dev/graphql-config.js node-graphql/config.js
    ```
    **Do NOT commit this code!**
4. Install graphql dependencies (instructions starting from project's root directory)
    ```
    cd node-graphql
    npm i
    ```
5. Start graphql
    ```
    node server.accounts.js
    ```
6. Copy a required configuration file to the node directory (instructions starting from project's root directory)
    ```
    cp dashboard-ui/public/configs/dev/config.js dashboard-ui/src/services/config.js
    ```
    **Do NOT commit this code!**
7. Install dashboard dependencies (instructions starting from project's root directory) (this may take awhile)
    ```
    cd dashboard-ui
    npm i
    ```
8. Start the dashboard
    ```
    npm start
    ```
9. Navigate to localhost:3000 and get started! (note: it may open automatically for you)

**Note:** 
If you switch back to using docker after running locally, be sure that you do not have two conflicting mongo instances running on port 27017. You can shutdown the one running locally from inside mongo shell with
```
use admin

db.shutdownServer()
```