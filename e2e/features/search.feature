@search @requires-e2e-credentials
Feature: Resource search
  As a user
  I want to search for FHIR resources by type
  So that I can find records without knowing their IDs in advance

  Background:
    Given I am signed in

  # An unfiltered search's actual result count depends on the target environment's data, so
  # this only asserts the app reaches a coherent end state (a results list or an explicit empty
  # state) rather than a specific count - keeps the scenario meaningful across environments.
  Scenario: Searching a resource type reaches a coherent result state
    When I search for "Patient" resources
    Then I should see search results or a "No Results Found" message
