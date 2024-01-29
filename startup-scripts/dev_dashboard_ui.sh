docker build --tag dashboard-ui dashboard-ui/.
cd docker_setup
docker-compose -f docker-compose-dev.yml up -d
cd ..