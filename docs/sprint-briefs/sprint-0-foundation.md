You are working on Rolecrft, a conversational career intelligence product.

Read `docs/codex-context.md` first and follow it strictly.

## Current state
- Frontend is largely inside `index.html` using React via CDN/Babel.
- Netlify functions already exist for `chat`, `search`, and `transform`.
- Supabase is initialized client-side.
- There is already working persona selection, chat UI, resume parsing, search, and fit-analysis-related flow.

## Task
Refactor the current prototype into a modular React app structure without changing product behavior.

## Goals
- Preserve current UI and user flow
- Extract frontend into `src`-based modules
- Keep existing Netlify functions working
- Add `.env.example`
- Prepare codebase for fast sprint iteration
- Remove hardcoded frontend secrets from application code where appropriate

## Deliver
1. Proposed file structure
2. Implementation changes
3. Migration notes
4. Risks or behavior differences
5. A short local test checklist

## Constraints
- Do not redesign the product
- Do not add new features unless required for modularization
- Keep Joshua/Adi behavior intact
- Keep current API contracts intact
- Preserve current Netlify deploy path or clearly document any necessary changes
