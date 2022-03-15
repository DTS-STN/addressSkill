#!/bin/bash
cd "${0%/*}"

# Verify that environment variable file exists
if [ ! -f "../.env" ]
then
  echo "Run make setup-local-env to setup the local environment first. Run make help for a list of the possible environments."
  exit 1
fi

# Import environment variable from ../.env (if present)
if [ -f "../.env" ]
then
    export $(egrep -v '^#' ../.env | xargs)
fi

# Import environment variable from ../app/.env
export $(egrep -v '^#' ../.env | xargs)

# Define current branch
GIT_BRANCH=`git rev-parse --abbrev-ref HEAD`
export GIT_LOCAL_BRANCH=$GIT_BRANCH

# Verify that all arguments were defined
if [ $# -lt 1 ]
then
  echo "Usage: $0 build-local-development/build-local-production/run-local-development/run-local-development-debug/run-local-production/close-local-production/close-local-development/development-database/pipeline-build/pipeline-lint/pipeline-tests/pipeline-clean-up"
  exit 1
fi

# ------------------------------------------------------------------------------
# Local development commands
# ------------------------------------------------------------------------------

#  Build development docker images
if [[ $1 == "build-local-development" ]]; then
	export MICROSOFT_APP_ID="${MICROSOFT_APP_ID}"
  export MICROSOFT_APP_PASSWORD="${MICROSOFT_APP_PASSWORD}"
  docker-compose -f ../docker-compose.yml build

# Build production docker images
elif [[ $1 == "build-local-production" ]]; then
	export MICROSOFT_APP_ID="${MICROSOFT_APP_ID}"
  export MICROSOFT_APP_PASSWORD="${MICROSOFT_APP_PASSWORD}"
  docker-compose -f ../docker-compose.production.yml build

# Run development container locally
elif [[ $1 == "run-local-development" ]]; then
		export MICROSOFT_APP_ID="${MICROSOFT_APP_ID}"
  export MICROSOFT_APP_PASSWORD="${MICROSOFT_APP_PASSWORD}"
  docker-compose -f ../docker-compose.yml up

# Run development container locally with debug
elif [[ $1 == "run-local-development-debug" ]]; then
	export MICROSOFT_APP_ID="${MICROSOFT_APP_ID}"
  export MICROSOFT_APP_PASSWORD="${MICROSOFT_APP_PASSWORD}"
  docker-compose -f ../docker-compose.yml run --service-ports --entrypoint "npm run start:debug" --name $PROJECT application

#  Run production container locally
elif [[ $1 == "run-local-production" ]]; then
	export MICROSOFT_APP_ID="${MICROSOFT_APP_ID}"
  export MICROSOFT_APP_PASSWORD="${MICROSOFT_APP_PASSWORD}"
  docker-compose -f ../docker-compose.production.yml up -d

# Stop containers and remove containers, networks, volumes, and images created for dev
elif [[ $1 == "close-local-production" ]]; then
  docker-compose -f ../docker-compose.production.yml down

# Stop containers and remove containers, networks, volumes, and images created for local dev
elif [[ $1 == "close-local-development" ]]; then
  docker-compose -f ../docker-compose.yml down

# Show development containers logs
elif [[ $1 == "logs-local-development" ]]; then
  docker-compose -f ../docker-compose.yml logs -f

# Shell into local database
elif [[ $1 == "development-workspace" ]]; then
  docker exec -it $PROJECT bash


# ------------------------------------------------------------------------------
# Pipeline build and deployment commands
# ------------------------------------------------------------------------------

# Build project images
elif [[ $1 == "pipeline-build" ]]; then
	export MSHU_COMMON_IDM_GIT_DEPLOY_KEY="`echo $MSHU_COMMON_IDM_GIT_DEPLOY_PRIVATE_KEY_BASE64 | base64 --decode`"
  export MSHU_COMMON_DB_GIT_DEPLOY_KEY="`echo $MSHU_COMMON_DB_GIT_DEPLOY_PRIVATE_KEY_BASE64 | base64 --decode`"
  docker-compose -f ../docker-compose.production.yml build

# ------------------------------------------------------------------------------
# Pipeline lint, test, and report commands
# ------------------------------------------------------------------------------

# Lint project
elif [[ $1 == "pipeline-lint" ]]; then
  docker-compose -f ../docker-compose.production.yml run --entrypoint "npm run lint" --name $PROJECT-lint application

# Run tests
elif [[ $1 == "pipeline-tests" ]]; then
	export COMMONDB_JWT_SECRET="`echo $DB_SDK_CERT_PRIVATE_KEY_BASE64 | base64 --decode`"
  export JWT_PRIVATE_KEY="`echo $JWT_PRIVATE_KEY_BASE64 | base64 --decode`"
  export JWT_PUBLIC_KEY="`echo $JWT_PUBLIC_KEY_BASE64 | base64 --decode`"
  docker-compose -f ../docker-compose.production.yml run --entrypoint "npm run test:ci" --name $PROJECT application

# ------------------------------------------------------------------------------
# Pipeline clean up commands
# ------------------------------------------------------------------------------

# Clean up pipeline by stopping containers and removing containers, networks, volumes, and images created during deployment
elif [[ $1 == "pipeline-clean-up" ]]; then
  docker-compose -f ../docker-compose.production.yml down

else
  echo "Invalid command."
  exit 1
fi