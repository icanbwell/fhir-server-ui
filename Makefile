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
	yarn install --no-optional

# https://www.npmjs.com/package/npm-check-updates
.PHONY:upgrade_packages
upgrade_packages:down
	. ${NVM_DIR}/nvm.sh && nvm use && \
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

.PHONY:clean-pre-commit
clean-pre-commit: ## removes pre-commit hook
	rm -f .git/hooks/pre-commit

.PHONY:setup-pre-commit
setup-pre-commit:
	cp ./pre-commit-hook ./.git/hooks/pre-commit

.PHONY:run-pre-commit
run-pre-commit: setup-pre-commit
	./.git/hooks/pre-commit

.PHONY:generate_components
generate_components:
	. ${NVM_DIR}/nvm.sh && nvm use && \
	docker run --rm -it --name pythongenerator --mount type=bind,source="${PWD}"/src,target=/src python:3.8-slim-buster sh -c "pip install lxml jinja2 && python3 src/generator/generate_components.py" \
	eslint --fix "src/pages/resources/**/*.tsx"

.PHONY:generate_types
generate_types:
	. ${NVM_DIR}/nvm.sh && nvm use && \
	docker run --rm -it --name pythongenerator --mount type=bind,source="${PWD}"/src,target=/src python:3.8-slim-buster sh -c "pip install lxml jinja2 && python3 src/generator/generate_types.py" \
	eslint --fix "src/types/**/*.ts"
