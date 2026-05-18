ACTIVATE_NODE = . ${NVM_DIR}/nvm.sh && nvm use && corepack enable

.PHONY:init
init:
	brew update
	brew install nvm
	. ${NVM_DIR}/nvm.sh && nvm install
	corepack enable
	make update

.PHONY:up
up:
	docker compose build --parallel && \
	docker compose up -d && \
	echo 'FHIR UI: http://localhost:5051'

.PHONY:down
down:
	docker compose down

.PHONY:update
update:down
	$(ACTIVATE_NODE) && \
	rm -f yarn.lock && \
	yarn install

# https://www.npmjs.com/package/npm-check-updates
.PHONY:upgrade_packages
upgrade_packages:down
	$(ACTIVATE_NODE) && \
	yarn install && \
	yarn dlx npm-check-updates -u --reject @sentry/react

.PHONY:tests
tests:
	$(ACTIVATE_NODE) && \
	yarn jest

.PHONY:lint
lint:
	$(ACTIVATE_NODE) && \
	yarn lint && \
	yarn build:ts

.PHONY:fix-lint
fix-lint:
	$(ACTIVATE_NODE) && \
	yarn eslint --fix "src/**/*.tsx" "src/**/*.ts" && \
	yarn lint

.PHONY:clean-pre-commit
clean-pre-commit: ## removes pre-commit hook
	rm -f .git/hooks/pre-commit

.PHONY:setup-pre-commit
setup-pre-commit:
	printf '#!/bin/bash\nyarn lint\n' > .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit

.PHONY:run-pre-commit
run-pre-commit: setup-pre-commit
	./.git/hooks/pre-commit

.PHONY:generate_components
generate_components:
	$(ACTIVATE_NODE) && \
	docker run --rm -it --name pythongenerator --mount type=bind,source="${PWD}"/src,target=/src python:3.8-slim-buster sh -c "pip install lxml jinja2 && python3 src/generator/generate_components.py" && \
	yarn eslint --fix "src/pages/resources/**/*.tsx"

.PHONY:generate_types
generate_types:
	$(ACTIVATE_NODE) && \
	docker run --rm -it --name pythongenerator --mount type=bind,source="${PWD}"/src,target=/src python:3.8-slim-buster sh -c "pip install lxml jinja2 && python3 src/generator/generate_types.py" && \
	yarn eslint --fix "src/types/**/*.ts"
