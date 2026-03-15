'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get('code');
      const next = searchParams.get('next') ?? '/app/roles/new';

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      window.location.replace(next);
    };

    void run();
  }, [searchParams, supabase]);

  return (
    <main className="page-shell">
      <section className="card">Completing sign in...</section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <section className="card">Completing sign in...</section>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
