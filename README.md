# dashboard-app
UI Applications.

# Running from Docker

Run all Docker Compose commands from the `docker_setup` directory.

For local development:

Before building the local development environment, make sure the corporate CA cert exists at:

```text
docker_setup/certs/ca-bundle.crt
```

Then run:

```bash
cd docker_setup
docker compose -f docker-compose-dev.yml up -d --build
```

For production:

```bash
cd docker_setup

# Start nginx first. This creates the shared dashboard-net network.
docker compose -f docker-compose-nginx.yml up -d --build

# Start the dashboard services.
docker compose -f docker-compose.yml up -d --build
```

If `itm-server` is managed separately and needs access to the dashboard network, connect it after starting the containers:

```bash
docker network connect dashboard-net itm-server 2>/dev/null || true
```

# Helpful Commands to Rebuild UI

To rebuild only the dashboard UI after making edits in that directory, run the appropriate Compose command from `docker_setup`.

For production:

```bash
cd docker_setup
docker compose -f docker-compose.yml up -d --build --force-recreate dashboard-ui
```

For development:

```bash
cd docker_setup
docker compose -f docker-compose-dev.yml up -d --build --force-recreate dashboard-ui
```

# Helpful Commands to Rebuild GraphQL and UI

If you made changes to `node-graphql` and also want to rebuild the UI, run the appropriate Compose command from `docker_setup`.

For development:

```bash
cd docker_setup
docker compose -f docker-compose-dev.yml up -d --build --force-recreate dashboard-server dashboard-ui
```

For production:

```bash
cd docker_setup
docker compose -f docker-compose.yml up -d --build --force-recreate dashboard-server dashboard-ui
```

# Helpful Command to Rebuild Nginx

To rebuild or restart only nginx without rebuilding the dashboard app containers:

```bash
cd docker_setup
docker compose -f docker-compose-nginx.yml up -d --build --force-recreate nginx
```

# Populate MongoDB with Backup

When you build the `dashboard-mongo` container for the first time, it will be empty. Follow these steps to populate it:

1. Navigate to AWS and download the most recent MongoDB backup from `S3/Buckets/itm-backups/mongodb`
2. Uncompress the file:

```bash
tar -xzvf <file_name>
```

3. Import data into MongoDB after the containers are running.

The file should uncompress to `dashboard-mongodb.dump`.

If restoring from your host machine with MongoDB tools installed:

```bash
mongorestore --uri="mongodb://<INSERT_MONGO_USERNAME>:<INSERT_MONGO_PASSWORD>@localhost:27030/?authSource=dashboard" --archive=dashboard-mongodb.dump --db dashboard
```

If restoring through the running Docker container:

```bash
docker exec -i dashboard-mongo sh -c "mongorestore --authenticationDatabase admin -u <INSERT_MONGO_USERNAME> -p <INSERT_MONGO_PASSWORD> --db dashboard --archive --drop --port 27030" < dashboard-mongodb.dump
```

# Helpful Tool for MongoDB

MongoDB Compass allows you to easily view all of the collections of the database.

1. You can find a download for MongoDB Compass on this page: https://www.mongodb.com/try/download/compass
2. Once you have downloaded and launched the application, use the following connection string:

```bash
mongodb://<INSERT_MONGO_USERNAME>:<INSERT_MONGO_PASSWORD>@localhost:27030/?authMechanism=DEFAULT&authSource=dashboard
```

# Admin Account

When you first make an account you will not be able to see the dashboard in its entirety, just the data collection pages.

To make yourself an admin you will need to add your username to `scripts/_0_0_6_set_admin_users.py` inside of the ITM-Ingest repo.

After running the script with your username added, you should be able to see all of the pages of the dashboard.

# Testing

The dashboard uses [jest-puppeteer](https://www.npmjs.com/package/jest-puppeteer) for testing. Use the following scripts at the root level of the project to run tests:

- `npm run setup-tests` - This will install all the necessary dependencies throughout the project in order to run the tests
- `npm run test` - This will run the UI tests in single test-run mode
- `npm run watch-tests` - This will run the UI tests in watch mode
- `npm run clean` - This removes all of the package-lock files and node_modules directories throughout the entire project to ensure a clean start
- To clean on Windows, run `npm run clean-win` instead.

## Quick Start

In the root directory, run:

```bash
npm run setup-tests && npm run test
```

## Ports Used

Testing uses port 3001 for the UI and 4000 for GraphQL. Both can be changed in the UI `.env` file.

## Mock DB

A [mock database](https://www.npmjs.com/package/mongodb-memory-server) is used to run tests. A new database is created for each test file and destroyed upon completion of the tests, ensuring that our real database is not polluted with test data.

The schemas for the mock database can be found in `dashboard-ui/src/__mocks__/mockDbSchema.js`. Any large pieces of mock data can be placed into `dashboard-ui/src/__mocks__/mockData.js`. The data is injected to the mock database in `dashboard-ui/src/setupTests.js`.

## Troubleshooting and Tips

- Ensure you are using node 16 or higher when testing. Use your node version manager to achieve this, such as `nvm use 16`.
- If the tests are not running, it is possible your ports did not get cleaned properly. Run `npm run clean-ports`, or if on Windows, run `npm run clean-ports-win`. If you changed the ports in the `.env` file, you will have to run this manually with your chosen ports.
- Tests are run in headless mode by default, meaning there is no physical browser doing the testing. To run in headful mode in order to watch execution:
  - In `dashboard-ui/jest-puppeteer.config.js`, set `headless` to `false` and uncomment the `slowMo` line.
  - If you need to slow down execution in order to check out console logs, add a line such as `await page.waitForSelector('text/nonsense');` to the end of your test, then set the timeout for the test to a very large number. This should give you enough time to investigate any problems.
- To look at the mock database, you will need to be very fast, as tests run quickly. Start by following the steps above to run the tests in headful mode.
  - Open up a new Mongo window.
  - Start the tests.
  - A Mongo URI will be printed to the console. Grab it and paste it in Compass to connect.
  - Once you're connected, you should be able to see a database called `test` with several recognizable collections.
  - As soon as the tests are done, the database will disconnect and you will lose access to the data. If you need to access it for additional time, I recommend dumping the database as soon as the tests start.
- To skip a test suite, change `describe` to `xdescribe`. Likewise, to skip a single test, change `it` to `xit`.
- Press Enter to rerun tests without making file changes while in watch mode. Press `w` to see all keyboard shortcuts for running tests.
- `await jestPuppeteer.debug()` can pause a test for easier debugging in the browser or database.
