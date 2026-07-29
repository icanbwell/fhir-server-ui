# Ticket-Based Development

Full development flow: fetch a Jira ticket, build an implementation plan, get approval, then run the app locally to implement.

## Step 1: Fetch the ticket

Use MCP `getJiraIssue` to fetch the Jira ticket. Extract:

- Summary / title
- Description
- Acceptance criteria
- Linked tickets / blockers
- Labels / components

## Step 2: Investigate the codebase

Before planning, understand what exists:

1. Find relevant files, components, and patterns across all 3 repos (see [utils/architecture.md](utils/architecture.md) for the dependency chain).
2. Identify blast radius — what other code depends on the files you'll touch?
3. Check for existing patterns that should be reused.

## Step 3: Build the implementation plan

Build a structured plan following the dev's CLAUDE.md **Phase 2** format:

1. **Init state** — what exists now (files, components, patterns involved)
2. **Issue description** — the problem being solved
3. **Goal** — desired end state
4. **Complexity** — Low / Medium / High with justification
5. **Steps** — numbered, each with files to touch and what changes
6. **New things** — any new component, pattern, dependency, or shared code change MUST be flagged explicitly
7. **Shared code modifications** — flag blast radius of any changes to shared code
8. **Unresolved questions** — concise list

## Step 4: Post the plan as a Jira comment

Use MCP `addCommentToJiraIssue` to post the plan on the ticket so the team has visibility.

## Step 5: Save the plan locally

Save the plan as `plans/<TICKET-KEY>.md` in em-mobile-platform so Claude Code can follow it step-by-step in this and future sessions.

## Step 6: Wait for approval

Present the plan to the dev and wait for approval before coding. If the dev requests changes, update both the Jira comment and the local plan file.

## Step 7: Run the app locally

Once the plan is approved, ask:

> Ready to run the app locally?

If yes → follow [run-locally.md](run-locally.md) starting from **Step 0** (branch selection → prerequisites → device selection → env validation → wire up → launch).

## Step 8: Implement the plan

With the app running locally, follow the saved plan step-by-step:

1. Make changes per the plan.
2. After each change to mfe-toolkit or ui-platform packages, follow the yalc workflow in [utils/workflows.md](utils/workflows.md#post-change-yalc-workflow-mandatory) to propagate changes.
3. Verify each step works on the device/emulator before moving to the next.
4. If something new is needed that wasn't in the plan, stop and discuss with the dev.

## Step 9: Cleanup, CI, commit, PR

Once implementation is complete, follow [run-locally.md](run-locally.md) **Steps 6–9**:

- **Step 6** — clean up all local dev wiring
- **Step 7** — reinstall & run CI checks
- **Step 8** — commit
- **Step 9** — PR (comment or create)
