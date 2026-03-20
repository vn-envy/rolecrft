# Rolecrft Manual Smoke Checklist

## Core smoke flow
- Open app
- Sign in
- Select English or Hinglish
- Confirm Joshua or Adi loads correctly
- Complete diagnostic
- Upload resume
- Paste JD
- Run fit analysis
- See fit snapshot in conversation
- Refresh page
- Confirm workspace and conversation persist

## Persona checks
- Joshua sounds direct, clear, strategic
- Adi sounds natural Hinglish, not awkward translation
- Internal persona labels do not appear in UI

## Pipeline resilience checks
- Empty JD
- Poorly formatted JD
- Empty resume upload
- Missing Serper key
- Transform returns malformed JSON
- Chat timeout or API failure
- Supabase insert failure

## Persistence checks
- Messages persist after reload
- Resume persists after reload
- JD persists after reload
- Fit snapshot persists after reload
- Returning user resumes correct workspace state
