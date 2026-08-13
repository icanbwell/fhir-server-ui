@api-console @requires-e2e-credentials
Feature: API Console
  As a developer
  I want to send a raw FHIR request from the API Console
  So that I can inspect exactly what the FHIR server returns

  Background:
    Given I am signed in

  # /version needs no patient/resource data and no request body, so this scenario stays
  # meaningful across environments without depending on test-data fixtures.
  Scenario: Sending a GET request shows the response
    When I open the API console
    And I set the request path to "/version"
    And I send the request
    Then I should see a successful response
