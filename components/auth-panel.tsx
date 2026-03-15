'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export function AuthPanel() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signInWithMagicLink = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/app/roles/new`
      }
    });

    setMessage(error ? error.message : 'Check your email for the magic link.');
    setIsLoading(false);
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/app/roles/new`
      }
    });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
    }
  };

  return (
    <section className="card auth-panel">
      <p className="kicker">Rolecrft Access</p>
      <h2 className="panel-title">Continue to your workspace</h2>
      <p className="panel-copy">Use the same understated Rolecrft flow with secure Supabase auth.</p>

      <label className="label" htmlFor="email">Email</label>
      <input
        id="email"
        className="input"
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <button className="btn btn-accent" onClick={signInWithMagicLink} disabled={isLoading || !email}>
        Send magic link
      </button>
      <button className="btn btn-secondary" onClick={signInWithGoogle} disabled={isLoading}>
        Continue with Google
      </button>

      {message ? <p className="feedback">{message}</p> : null}
    </section>
  );
}
