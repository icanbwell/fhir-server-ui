@composition-index @requires-e2e-credentials
Feature: Composition Index
  As a user
  I want to see every Composition for a person grouped by category and version
  So that I can jump straight to the one I need instead of scrolling through search results

  Background:
    Given I am signed in

  # Whether the target environment's first Person actually has any Compositions is
  # environment-dependent, so this only asserts the page reaches a coherent end state (a
  # matrix or an explicit empty state) - mirrors search.feature's approach for the same reason.
  Scenario: Opening the Composition Index from a Person search result
    When I search for "Person" resources
    And I open the composition index for the first search result
    Then I should see the composition index or a "No Compositions found" message
