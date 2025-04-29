#!/bin/bash

# Default to local if no environment is specified
ENV=${1:-local}

echo "Deploying SmartOne ERP in $ENV environment..."

if [ "$ENV" = "prod" ] || [ "$ENV" = "production" ]; then
  COMPOSE_FILE="docker-compose.prod.yml"
  URL="https://erp.smartone.id"
elif [ "$ENV" = "local" ]; then
  COMPOSE_FILE="docker-compose.local.yml"
  URL="http://localhost:3100"
else
  COMPOSE_FILE="docker-compose.yml"
  URL="http://localhost:3100"
fi

# Stop any running containers
echo "Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down

# Build and start the containers
echo "Building and starting containers..."
docker-compose -f $COMPOSE_FILE up -d

echo "Waiting for the application to start..."
sleep 10

echo "SmartOne ERP is deployed and running on $URL"
echo "Database is accessible at localhost:5432"
echo "- Username: postgres"
echo "- Password: 0135"
echo "- Database: smartone_erp"

echo "To view logs: docker-compose -f $COMPOSE_FILE logs -f app" 