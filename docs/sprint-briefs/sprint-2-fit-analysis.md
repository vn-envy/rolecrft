You are working on Rolecrft.

Read `docs/codex-context.md` first and follow it strictly.

## Task
Harden the fit analysis pipeline and persist fit snapshots.

## Current context
- Search proxy exists
- Transform proxy exists
- Chat proxy exists
- Fit-related logic currently lives too much in the UI layer

## Goal
Move orchestration for fit analysis into server-side functions and return normalized payloads that can be stored and rendered reliably.

## Required work
- Create a server-side analysis orchestration function, e.g. `analyze-workspace.js`
- Accept workspace context as input
- Run these steps with clear state transitions:
  1. validate inputs
  2. extract/normalize JD structure
  3. enrich company/role context where available
  4. compute score breakdown
  5. produce fit snapshot payload
  6. persist fit snapshot
  7. update workspace status
- Return normalized payloads for UI rendering
- Add structured error states
- Add logging for pipeline step, duration, and failure reason

## Constraints
- Keep conversation delivery intact
- The fit result should still be delivered as a conversational beat, not only as a dashboard
- Keep current `search`, `transform`, and `chat` functions working unless wrappers are needed

## Deliver
- analysis orchestration function
- normalized payload schema
- persistence implementation
- failure-state behavior
- manual QA steps
