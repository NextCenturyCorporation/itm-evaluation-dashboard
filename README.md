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