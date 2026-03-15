# Rolecrft (Next.js + Supabase)

This project now runs on **Next.js + TypeScript** and uses **Supabase Auth** with:

- Email magic link sign-in
- Google OAuth sign-in

## Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Supabase setup

1. In your Supabase project, enable providers:
   - **Email** (magic link)
   - **Google**
2. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://<your-domain>/auth/callback`
3. Run the SQL in `supabase/schema.sql` inside the SQL editor.

## Run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
