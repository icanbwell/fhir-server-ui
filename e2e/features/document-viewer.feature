@document-viewer @requires-e2e-credentials
Feature: Document Viewer
  As a user
  I want to open a DocumentReference's attachment in the Document Viewer
  So that I can preview its content without downloading it first

  Background:
    Given I am signed in

  # Narrower precondition than resource-viewer.feature: assumes at least one
  # DocumentReference with a content[] entry exists in the target environment.
  Scenario: Viewing a DocumentReference's attachment
    When I search for "DocumentReference" resources
    And I open the first search result
    And I view the document
    Then I should see the document preview
