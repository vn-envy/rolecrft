'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get('code');
      const next = searchParams.get('next') ?? '/workspace';

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

     window.location.replace(next);
    };

    void run();
  }, [router, searchParams, supabase]);

  return (
    <main className="page-shell">
      <section className="card">Completing sign in...</section>
    </main>
  );
}
