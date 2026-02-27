## fhir-server-ui

UI to display FHIR resources in a web browser

## Documentation

For information about FHIR bundle filters and search parameters, see [docs/FILTERS.md](docs/FILTERS.md).

## Running FHIR Server UI in local environment

To run the FHIR Server UI in a local environment:
1. Run `make up` to start the server.

## Stopping the Server

To stop the server:
1. Run `make down`.

## Linting

To check linting of the code:
1. Run `make lint`.

## Upgrading & Updating Packages

To upgrade npm packages:
1. Run `make upgrade_packages`.

To update npm packages:
1. Run `make update`.

## Generating Types & Components

To generate components:
1. Run `make generate_components`.

To generate types:
1. Run `make generate_types`.

## Terminal Warning
When running the application, you might encounter the following warning in the terminal `Failed to parse source map`. 
This warning occurs because the `graphiql` package references a source map file (`graphiql.css.map`) that is not present in the package. Source maps are used by development tools to map minified code back to the original source code, which can be useful for debugging. However, the absence of this source map file does not affect the functionality of the application.
- **No Functional Impact**: The warning does not impact the behavior or performance of the application. It is safe to ignore.
- **Development Environment Only**: This issue is typically only present during development and does not affect production builds.
