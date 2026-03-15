import { AuthPanel } from '@/components/auth-panel';

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero card-elevated">
        <p className="kicker">Rolecrft</p>
        <h1>Craft your way in.</h1>
        <p>
          Your existing Rolecrft experience now supports Supabase authentication and persisted
          workspace intelligence.
        </p>
      </section>

      <AuthPanel />
    </main>
  );
}
