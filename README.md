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
bash startup-scripts/dev_dashboard_ui.sh
```

# Helpful Script to Rebuild Graphql and UI

If you made changes to the node-graphql then from the base `itm_dashboard` directory run:

For Production
```
bash startup-scripts/graphql_dashboard_ui.sh
```

For Development
```
bash startup-scripts/dev_graphql_dashboard_ui.sh
```

# Populate MongoDB with Backup
When you build the dashboard-mongo container for the first time, it will be empty. Follow these steps to populate it:

1. Navigate to AWS and download the most recent mongodb backup from S3/Buckets/itm-backups/mongodb
2. Uncompress the file
```
tar -xzvf <file_name>
```
3. Import data into MongoDB (file should uncompress to dashboard-mongodb.dump)
```
mongorestore --uri="mongodb://<INSERT_MONGO_USERNAME>:<INSERT_MONGO_PASSWORD>@localhost:27030/?authSource=dashboard" --archive=dashboard-mongodb.dump --db dashboard
```
# Helpful Tool for MongoDB
MongoDB Compass allows you to easily view all of the collections of the database.

1. You can find a download for MongoDB Compass on this page https://www.mongodb.com/try/download/compass
2. Once you have downloaded and launched the application, use the following connection string
```
mongodb://<INSERT_MONGO_USERNAME>:<INSERT_MONGO_PASSWORD>@localhost:27030/?authMechanism=DEFAULT&authSource=dashboard
```

#  Admin Account
When you first make an account you will not be able to see the dashboard in its entirety, just the data collection pages.
To make yourself an admin you will need to add your username to scripts/_0_0_6_set_admin_users.py inside of the ITM-Ingest repo.
After running the script with your username added, you should be able to see all of the pages of the dashboard. 

# Testing
The dashboard uses [jest-puppeteer](https://www.npmjs.com/package/jest-puppeteer) for testing. Use the following scripts at the root level of the project to run tests:
- `npm run setup-tests` - This will install all the necessary dependencies throughout the project in order to run the tests
- `npm run test` - This will run the UI tests in watch-mode
- `npm run clean` - This removes all of the package-lock files and node_modules directories throughout the entire project to ensure a clean start

## Quick Start
In the root directory, run 
```
npm run setup-tests && npm run test
```

## Ports Used
Testing uses port 3001 for the UI and 4000 for graphql. Both can be changed in the ui .env file.

## Mock DB
A [mock database](https://www.npmjs.com/package/mongodb-memory-server) is used to run tests. A new database is created for each test file and destroyed upon completion of the tests, ensuring that our real database is not polluted with test data. The schemas for the mock database can be found in `dashboard-ui/src/__mocks__/mockDbSchema.js`. Any large pieces of mock data can be placed into `dashboard-ui/src/__mocks__/mockData.js`. The data is injected to the mock database in `dashboard-ui/src/setupTests.js`

## Troubleshooting and Tips
- Ensure you are using node 16 or higher when testing. Use your node version manager to achieve this (i.e. `nvm use 16`)
- If the tests are not running, it is possible your ports did not get cleaned properly. Run `npm run clean-ports`. If you changed the ports in the .env file, you will have to run this manually with your chosen ports
- Tests are run in headless mode by default, meaning there is no physical browser doing the testing. To run in headful mode in order to watch execution:
  - In `dashboard-ui/jest-puppeteer.config.js`, set `headless` to `false` and uncomment the `slowMo` line.
  - If you need to slow down execution in order to check out console logs, add a line such as `await page.waitForSelector('text/nonsense');` to the end of your test, then set the timeout for the test to a very large number. This should give you enough time to investigate any problems
- To look at the mock database, you will need to be very fast, as tests run quickly. Start by following the steps above to run the tests in headful mode.
  - Open up a new mongo window
  - Start the tests
  - A mongo uri will be printed to the console. Grab it and paste it in compass to connect
  - Once you're connected, you should be able to see a database called `test` with several recognizable collections. 
  - As soon as the tests are done, the database will disconnect and you will lose access to the data. If you need to access it for additional time, I recommend dumping the db as soon as the tests start.
- To skip a test suite, change `describe` to `xdescribe`. Likewise, to skip a single test, change `it` to `xit`.
- Press Enter to rerun tests without making file changes while in watch mode, press `w` to see all keyboard shortcuts for running tests
- `await jestPuppeteer.debug()` can pause a test for easier debugging in the browser or database.

