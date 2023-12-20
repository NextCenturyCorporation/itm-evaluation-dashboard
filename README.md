# dashboard-app
UI Applications. 

# Running from Docker

```
docker build --tag dashboard-graphql node-graphql/.
docker build --tag dashboard-ui dashboard-ui/.

cd docker_setup
docker-compose up -d
```

# Helpful Script to Rebuild UI

To rebuild only the dashboard-ui after making edits in that directory, from the base `itm_dashboard` directory run:
```
bash dahsboard_ui.sh
```

# Helpful Script to Rebuild Graphql and UI

If you made changes to the node-graphql then from the base `itm_dashboard` directory run:
```
bash graphql_dashboard_ui.sh
```

# Populate MongoDB with Backup
When you build the dashboard-mongo container for the first time, it will be empty. Follow these steps to populate it:

1. Navigate to AWS and download backup.tar.gz from s3 bucket
2. Uncompress the file
```
tar -xzvf backup.tar.gz
```
3. Import data into MongoDB
```
mongorestore --uri="mongodb://<INSERT_MONGO_USERNAME>:<INSERT_MONGO_PASSWORD>@localhost:27017/?authSource=dashboard" backup 
```
