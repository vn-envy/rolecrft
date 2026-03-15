'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

export default function WorkspacePage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const routeUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      router.replace(user ? '/app/roles' : '/');
    };

    void routeUser();
  }, [router, supabase]);

  return <main className="page-shell"><section className="card">Opening your workspace...</section></main>;
}
