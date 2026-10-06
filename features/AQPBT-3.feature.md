# AQPBT-3 — Gherkin (form open and review; successful submit out of scope)

```gherkin
Feature: Communities create group — open and complete the new-community form for review

  As a signed-in parent
  I want to open the create-community form and enter group details plus which children to include
  So that I can review the information on the form before deciding to submit

  Background:
    Given I am signed in as the main practicum family
    And I have loaded the current family's children from GET "/api/v1/me"

  # Happy paths

  Scenario: AC1 — Open create form via direct URL
    When I open "/communities/new"
    Then the URL is "/communities/new"
    And "Create a community" is visible

  Scenario: AC1 — Open create form from communities list
    Given I am on "/communities"
    When I click "+ Create group"
    Then the URL is "/communities/new"
    And "Create a community" is visible

  Scenario: AC2 — Create form shows main controls
    When I open "/communities/new"
    Then the textbox "Group name" is visible
    And the combobox "Type" is visible
    And the textbox "Description (optional)" is visible
    And the button "Create group" is visible
    And the link "Cancel" is visible
    And the link "← Back to communities" is visible

  Scenario: AC3 — Type defaults to Class or activity
    When I open "/communities/new"
    Then "Class or activity" is selected in the combobox "Type"

  Scenario: AC4 — Type can be changed to School
    When I open "/communities/new"
    And I select "School" in the combobox "Type"
    Then "School" is selected in the combobox "Type"

  Scenario: AC5 — Child checkboxes match current family roster from GET /api/v1/me
    When I open "/communities/new"
    Then the group "Which of your children are in this group?" is visible
    And "Only selected children will be visible to members." is visible
    And for each firstName in GET "/api/v1/me" family.children, the child checkbox with exact accessible name firstName is visible

  Scenario: AC6 — Cancel returns to communities list
    When I open "/communities/new"
    And I click "Cancel"
    Then the URL is "/communities"
    And the heading "Your communities" is visible

  Scenario: AC6 — Back link returns to communities list
    When I open "/communities/new"
    And I click "← Back to communities"
    Then the URL is "/communities"
    And the heading "Your communities" is visible

  # Negative

  Scenario: AC7 — Empty Group name blocks submit on Create group
    When I open "/communities/new"
    And the textbox "Group name" is empty
    When I click "Create group"
    Then the URL is "/communities/new"
    And the textbox "Group name" is focused
    And "Create a community" is visible

  # Edge cases

  Scenario: Edge — Type can be switched from default to School and back to Class or activity
    When I open "/communities/new"
    Then "Class or activity" is selected in the combobox "Type"
    When I select "School" in the combobox "Type"
    Then "School" is selected in the combobox "Type"
    When I select "Class or activity" in the combobox "Type"
    Then "Class or activity" is selected in the combobox "Type"

  Scenario: Edge — A current family child checkbox can be checked and then unchecked
    Given the toggled child first name is the first firstName from GET "/api/v1/me" family.children
    When I open "/communities/new"
    And the child checkbox with exact accessible name matching the toggled child first name is not checked
    When I check the child checkbox with exact accessible name matching the toggled child first name
    Then the child checkbox with exact accessible name matching the toggled child first name is checked
    When I uncheck the child checkbox with exact accessible name matching the toggled child first name
    Then the child checkbox with exact accessible name matching the toggled child first name is not checked
    And the URL is "/communities/new"
    And "Create a community" is visible

  Scenario: Edge — Leave with entered Group name via Cancel does not require successful submit
    When I open "/communities/new"
    And I fill "Group name" with a unique group name from buildCommunityGroupName()
    When I click "Cancel"
    Then the URL is "/communities"
    And the heading "Your communities" is visible
```

<!--
Ambiguities / gaps (AQPBT-3 + Confluence page 307593217):

- Signed-in family with zero children: AC5 UI behavior on `/communities/new` remains unspecified.
- Empty Group name: validation message text not confirmed (AC7 asserts focus, URL, and heading only).
- Logged-out access to /communities/new not specified.
- Whether at least one child must be selected before submit not specified.
- Field maxlength (Group name 100, Description 500) rejection behavior not in ACs.
- Successful Create group and post-submit hub, list, or admin explicitly out of scope.

Automation notes:
- Expected child checkbox labels: GET /api/v1/me → family.children[].firstName (not hardcoded).
- Locators: CommunitiesNewPage.childCheckbox(firstName) — getByRole("checkbox", { name, exact: true })
  scoped under the children group.
- AC5 and child-toggle edge: if family.children.length === 0, test.skip(
  "Requires a family with children; GET /api/v1/me returned an empty roster."
  ); when children exist, run all checkbox assertions unchanged.
- Group name edge: buildCommunityGroupName() from test-data/factories/community.factory.ts.
-->
