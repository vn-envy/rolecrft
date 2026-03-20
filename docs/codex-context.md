# Rolecrft Codex Context

Rolecrft is a conversational career intelligence product for India.

## Product principles
- Conversation is the interface.
- Workspace is the atomic unit.
- Every role gets one workspace.
- Conversation is first-class product data.
- CRM is a projection of workspace and conversation state, not a separate workflow.
- Joshua and Adi are the main user-facing surfaces.
- Joshua = direct English strategist.
- Adi = natural Hinglish peer coach.
- Persona routing is internal. Internal routing labels must never leak into the UI.

## Phase 1 scope
- Auth
- Persona/language selection
- Diagnostic flow
- Resume upload
- JD intake
- Fit analysis delivered in conversation
- Resume rewrite
- PDF generation
- Paid download unlock

## Non-goals for current sprint window
- Browser extension
- WhatsApp channel
- Multi-role kanban
- Interview squad
- Salary benchmarking
- Large architecture rewrites beyond what is needed for current sprint

## Current implementation facts
- Frontend currently lives largely in a single index.html using React via CDN and Babel.
- Supabase is initialized client-side today.
- Netlify functions exist for chat, search, and transform.
- Netlify is currently configured as a static SPA with functions.
- Existing behavior should be preserved where possible while modularizing.

## Engineering rules
- Preserve current product behavior unless the task explicitly changes behavior.
- Keep existing function contracts stable unless change is required and documented.
- Optimize for fast iteration and visible product progress.
- Add minimal tests for critical user flows.
- Avoid overengineering.
- Prefer small, reversible changes.

## Required response format for every task
Return these sections:
- What changed
- Files created/edited
- What to test manually
- Known risks
- Next smallest logical task
