@auth
Feature: Client credentials sign-in
  As a user without an interactive identity provider
  I want to sign in with a client ID and secret
  So that I can access the FHIR UI non-interactively

  Background:
    Given I am on the client credentials login page

  @auth-smoke @requires-e2e-credentials
  Scenario: Successful sign-in with valid credentials
    When I sign in with valid client credentials
    Then I should be signed in

  @requires-e2e-credentials
  Scenario: An invalid client secret is rejected
    When I sign in with an invalid client secret
    Then I should see a sign-in error
    And I should still be on the client credentials login page
