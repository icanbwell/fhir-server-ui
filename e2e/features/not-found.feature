@smoke
Feature: Unknown routes
  As a user who follows a bad or stale link
  I want a clear "not found" page instead of a blank screen
  So that I know the URL was wrong rather than the app being broken

  # Requires no sign-in and no FHIR server data: the catch-all route in App.tsx renders
  # NotFoundPage for anything that doesn't match a known path, regardless of auth state.
  Scenario: Navigating to an unknown route shows the not found page
    When I navigate to "/this-route-does-not-exist"
    Then I should see the not found page
