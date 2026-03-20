You are working on Rolecrft.

Read `docs/codex-context.md` first and follow it strictly.

## Task
Implement persisted workspace-first diagnostic flow using Supabase.

## Product requirements
- User signs in with Supabase Auth
- On first visit user selects English or Hinglish
- That sets language preference and default persona
- One workspace is created per role journey
- Conversation history is persisted per workspace
- Resume upload is persisted as master resume
- JD raw text is persisted in workspace
- Diagnostic answers are persisted
- User can reload and return to the same conversation state

## Data model to implement now
- users
  - id
  - email
  - name
  - persona_blend jsonb
  - language_pref
  - tier
  - created_at
- workspaces
  - id
  - user_id
  - role_title
  - company
  - jd_raw
  - jd_parsed jsonb
  - status
  - created_at
- conversations
  - id
  - workspace_id
  - persona
  - messages jsonb[]
  - created_at
- resumes
  - id
  - workspace_id
  - version
  - content jsonb
  - scores jsonb
  - pdf_url
  - is_master
  - created_at
- fit_snapshots
  - id
  - workspace_id
  - overall_score
  - category_scores jsonb
  - gaps jsonb[]
  - created_at
- payments
  - id
  - user_id
  - razorpay_order_id
  - amount
  - tier_unlocked
  - created_at

## Required work
- Add Supabase migrations
- Add enums for workspace_status, persona_type, user_tier, language_pref
- Add RLS policies
- Add auth provider and protected routes
- Persist language/persona choice
- Persist conversation messages per workspace
- Persist resume upload text/content
- Persist JD raw text
- Ensure returning users resume where they left off

## Constraints
- Keep product conversation-first
- Do not build multi-workspace management UI yet
- Do not build CRM view yet
- Do not introduce Phase 2 features

## Deliver
- SQL migrations
- frontend persistence implementation
- route/state behavior notes
- manual QA checklist
- known edge cases
