#!make

-include .env

# Set environment variables for local development or CI/CD pipelines
export $(shell sed 's/=.*//' .env)
export GIT_LOCAL_BRANCH?=$(shell git rev-parse --abbrev-ref HEAD)
export DEPLOY_DATE?=$(shell date '+%Y%m%d%H%M')

define deployTag
"${PROJECT}-${DEPLOY_DATE}"
endef

# To add colors when printing messages
ccyellow=$(echo -e "\033[0;33m")

# Some make commands are executing ".build/build_scripts.sh".
# That file is a utility bash script that also inject the environment variables from
# the app/.env file before executing commands. This approach allow us to keep deployment
# variables from the .env from the root of the project isolated.

# ------------------------------------------------------------------------------
# Default Command
# ------------------------------------------------------------------------------
all 		  : help
.DEFAULT 	: help

# ------------------------------------------------------------------------------
# Task Aliases
# ------------------------------------------------------------------------------

# local-development          - Build and run the development image locally
# local-production           - Build and run the production image locally
# pipeline-deploy-dev        - Setup development env variables, push production image to ECR, generate Dockerrun.aws.json, then deploys to Elasticbeanstalk
# pipeline-deploy-staging    - Setup staging env variables, push production image to ECR, generate Dockerrun.aws.json, then deploys to Elasticbeanstalk
# pipeline-deploy-production - Setup production env variables, push production image to ECR, generate Dockerrun.aws.json, then deploys to Elasticbeanstalk
# pipeline-audit             - Installs node modules and runs the security scan

local-development:          | setup-local-env build-local-development run-local-development  ## Task-Alias -- Build and run the development image locally
local-development-debug:    | setup-local-env build-local-development run-local-development-debug ## Task-Alias -- Build and run the development image locally with debugger
local-production:           | setup-local-env build-local-production run-local-production ## Task-Alias -- Build and run the production image locally
pipeline-deploy-dev:        | setup-development-env print-status pipeline-push pipeline-deploy-prep pipeline-deploy-version
pipeline-deploy-testing:    | setup-testing-env print-status pipeline-push pipeline-deploy-prep pipeline-deploy-version
pipeline-deploy-staging:    | setup-staging-env print-status pipeline-push pipeline-deploy-prep pipeline-deploy-version
pipeline-deploy-production: | setup-production-env print-status pipeline-push pipeline-deploy-prep pipeline-deploy-version
pipeline-audit:             | pipeline-build-audit pipeline-report-audit

# ------------------------------------------------------------------------------
# Status Output
# ------------------------------------------------------------------------------

print-status: ## Print status of deployment environment variables
	@echo " +---------------------------------------------------------+ "
	@echo " | Current Settings                                        | "
	@echo " +---------------------------------------------------------+ "
	@echo " | ACCOUNT ID: $(ACCOUNT_ID) "
	@echo " | PROJECT: $(PROJECT) "
	@echo " | REGION: $(REGION) "
	@echo " | PROFILE: $(PROFILE) "
	@echo " | DEPLOY ENV: $(DEPLOY_ENV) "
	@echo " | MERGE BRANCH: $(MERGE_BRANCH) "
	@echo " +---------------------------------------------------------+ "

# ------------------------------------------------------------------------------
# Utility commands
# ------------------------------------------------------------------------------

setup-local-env: ## Preparing project for local environment
	@echo "+\n++ Make: Preparing project for local environment...\n+"
	@cp .config/.env.local ./.env

setup-test-env: ## Preparing project for test environment
	@echo "+\n++ Make: Preparing project for test environment...\n+"
	@cp .config/.env.test ./.env

setup-development-env: ## Preparing project for dev environment
	@echo "+\n++ Make: Preparing project for dev environment...\n+"
	@cp .config/.env.dev ./.env

setup-staging-env: ## Preparing project for staging environment
	@echo "+\n++ Make: Preparing project for staging environment...\n+"
	@cp .config/.env.staging ./.env

setup-production-env: ## Preparing project for production environment
	@echo "+\n++ Make: Preparing project for production environment...\n+"
	@cp .config/.env.production ./.env

# ------------------------------------------------------------------------------
# Local development commands
# ------------------------------------------------------------------------------

build-local-development: ## Build development docker images
	@echo "+\n++ Building local development Docker image...\n+"
	@bash .build/build_scripts.sh build-local-development

build-local-production: ## Build production docker images
	@echo "+\n++ Building local production Docker image...\n+"
	@bash .build/build_scripts.sh build-local-production

run-local-development: ## Run development container locally
	@echo "+\n++ Running development container locally\n+"
	@bash .build/build_scripts.sh run-local-development

run-local-development-debug: ## Run development container locally with debug
	@echo "+\n++ Running development container locally\n+"
	@bash .build/build_scripts.sh run-local-development-debug

run-local-production: ## Run production container locally
	@echo "+\n++ Running production container locally\n+"
	@bash .build/build_scripts.sh run-local-production

close-local-development: ## Stop containers and remove containers, networks, volumes, and images created for local dev
	@echo "+\n++ Closing local development container\n+"
	@bash .build/build_scripts.sh close-local-development

close-local-production: ## Stop containers and remove containers, networks, volumes, and images created for local production
	@echo "+\n++ Closing local production container\n+"
	@bash .build/build_scripts.sh close-local-production

development-workspace: ## Shell into api local container
	@bash .build/build_scripts.sh development-workspace

development-database: ## Shell into local database
	@echo "Shelling into local database..."
	@bash .build/build_scripts.sh development-database

# ------------------------------------------------------------------------------
# Pipeline build and deployment commands
# ------------------------------------------------------------------------------

pipeline-build: ## Build project images
	@echo "+\n++ Performing build of Docker images...\n+"
	@echo "Tagging images with: $(GIT_LOCAL_BRANCH)"
	@bash .build/build_scripts.sh pipeline-build


# ------------------------------------------------------------------------------
# Pipeline lint, test, and report commands
# ------------------------------------------------------------------------------

pipeline-lint: ## Lint project
	@echo "+\n++ Linting project...\n+"
	@bash .build/build_scripts.sh pipeline-lint

pipeline-tests: ## Run tests
	@echo "+\n++ Running tests...\n+"
	@bash .build/build_scripts.sh pipeline-tests

pipeline-report: ## Copy test reports to the root of the project so it can be retrieved later on the pipeline logs
	@echo "+\n++ Reporting...\n+"
	@docker cp $(PROJECT):/usr/src/app/test-results .

pipeline-sonar:
	@docker-compose -f docker-compose.sonar.yml up -d

# ------------------------------------------------------------------------------
# Pipeline clean up commands
# ------------------------------------------------------------------------------

pipeline-clean-up: ## Clean up pipeline by stopping containers and removing containers, networks, volumes, and images created during deployment
	@echo "+\n++ Cleaning up...\n+"
	@bash .build/build_scripts.sh pipeline-clean-up

# ------------------------------------------------------------------------------
# Makefile utility commands
# ------------------------------------------------------------------------------

help:  ## Display this help screen.
	@echo "\033[0;33mSome of the commands below require deployment variables. Those should be present on the BitBucket Pipeline."
	@echo "To run deployment related commands from your local environment, you need to add a .env file to the root of"
	@echo "the project with the variables specified on the README.md"
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'