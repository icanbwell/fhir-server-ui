@resource-viewer @requires-e2e-credentials
Feature: Resource detail view
  As a user
  I want to open a search result to see its full detail
  So that I can inspect a specific resource's data

  Background:
    Given I am signed in

  # Unlike search.feature, this assumes at least one Patient exists in the target
  # environment - a reasonable baseline precondition, but a real one (unlike the "either
  # outcome" robustness search.feature builds in), since opening a result requires a result.
  Scenario: Opening a search result shows its detail
    When I search for "Patient" resources
    And I open the first search result
    Then I should see that resource's detail
