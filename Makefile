.PHONY:build
build:
	docker buildx build --platform=linux/amd64 -t imranq2/node-fhir-server-ui:local .

.PHONY:build_all
build_all:
	docker buildx build --platform=linux/amd64,linux/arm64 -t imranq2/node-fhir-server-ui:local .

.PHONY:publish
publish:
	docker push imranq2/node-fhir-server-ui:latest

.PHONY:up
up:
	docker compose -f docker-compose.yml  -p fhir-dev-ui build --parallel && \
	docker compose -p fhir-dev-ui -f docker-compose.yml up --detach && \
	echo FHIR server: http://localhost:3000

.PHONY:up-offline
up-offline:
	docker compose -p fhir-dev-ui -f docker-compose.yml up --detach && \
	echo FHIR server: http://localhost:3000

.PHONY:down
down:
	docker compose -p fhir-dev-ui -f docker-compose.yml down && \
	docker system prune -f

.PHONY:clean
clean: down
	docker image rm imranq2/node-fhir-server-ui -f
	docker image rm node-fhir-server-ui_fhir -f
	docker volume rm fhir-dev-ui_mongo_data -f
ifneq ($(shell docker volume ls | grep "fhir-dev-ui"| awk '{print $$2}'),)
	docker volume ls | grep "fhir-dev-ui" | awk '{print $$2}' | xargs docker volume rm
endif

.PHONY:init
init:
	brew update  # update brew
	#brew upgrade  # upgrade all installed packages
	brew install yarn
	brew install kompose
	#brew install nvm
	curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.39.1/install.sh | zsh
	nvm install
	make update


.PHONY:update
update:down
	. ${NVM_DIR}/nvm.sh && nvm use && \
	npm install --location=global yarn && \
	rm -f yarn.lock && \
	yarn install --no-optional && \
	cd src/web && \
	rm -f yarn.lock && \
	yarn install --no-optional && \
	npm i --package-lock-only

# https://www.npmjs.com/package/npm-check-updates
.PHONY:upgrade_packages
upgrade_packages:down
	. ${NVM_DIR}/nvm.sh && nvm use && \
	yarn install --no-optional && \
	ncu -u --reject @sentry/node && \
	cd src/web && \
	yarn install --no-optional && \
	ncu -u --reject @sentry/node

.PHONY:tests
tests:
	. ${NVM_DIR}/nvm.sh && nvm use && \
	npm run test

.PHONY:lint
lint:
	. ${NVM_DIR}/nvm.sh && nvm use && \
	npm run lint

.PHONY:fix-lint
fix-lint:
	. ${NVM_DIR}/nvm.sh && nvm use && \
	npm run fix_lint && \
	npm run lint

.PHONY:shell
shell: ## Brings up the bash shell in dev docker
	docker compose -p fhir-dev-ui -f docker-compose.yml run --rm --name fhir-ui fhir-ui /bin/sh

.PHONY:clean-pre-commit
clean-pre-commit: ## removes pre-commit hook
	rm -f .git/hooks/pre-commit

.PHONY:setup-pre-commit
setup-pre-commit:
	cp ./pre-commit-hook ./.git/hooks/pre-commit

.PHONY:run-pre-commit
run-pre-commit: setup-pre-commit
	./.git/hooks/pre-commit
