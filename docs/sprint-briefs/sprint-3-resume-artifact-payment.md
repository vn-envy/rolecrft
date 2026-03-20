You are working on Rolecrft.

Read `docs/codex-context.md` first and follow it strictly.

## Task
Implement resume rewrite artifact, PDF generation, and ₹149 payment unlock.

## Goal
The user should be able to review rewrites inline, see a live artifact preview, and unlock final download via Razorpay.

## Required work
- Build rewrite orchestration endpoint, e.g. `rewrite-resume.js`
- Generate rewritten bullets/sections from workspace + fit snapshot + master resume
- Support inline accept/reject/regenerate interaction
- Create a persisted tailored resume artifact per workspace
- Build PDF generation that matches preview closely
- Add Razorpay order creation flow
- Add post-payment unlock behavior
- Update user tier/payment record after successful payment

## Constraints
- Keep Phase 1 scope only
- Do not implement search pack or premium flows beyond minimal extensibility
- Preserve conversation-first UX

## Deliver
- rewrite flow implementation
- artifact preview implementation
- PDF generation implementation
- payment integration notes
- manual QA checklist
