@composition-summary @requires-e2e-credentials
Feature: Composition Summary
  As a user
  I want to open a Composition's summary view
  So that I can review its sections without reading raw FHIR JSON

  Background:
    Given I am signed in

  # Assumes at least one Composition exists in the target environment.
  Scenario: Viewing a Composition's summary
    When I search for "Composition" resources
    And I open the first search result
    And I view the composition summary
    Then I should see the composition summary
