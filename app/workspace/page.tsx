'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

type Profile = {
  full_name: string | null;
  headline: string | null;
};

export default function WorkspacePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const loadWorkspace = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name, headline')
        .eq('id', user.id)
        .single();

      setProfile(data);
      setLoading(false);
    };

    void loadWorkspace();
  }, [router, supabase]);

  if (loading) {
    return <main className="page-shell"><section className="card">Loading workspace...</section></main>;
  }

  return (
    <main className="page-shell">
      <section className="card-elevated hero">
        <p className="kicker">Workspace</p>
        <h1>Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}.</h1>
        <p>{profile?.headline ?? 'Your Rolecrft intelligence graph is ready to populate.'}</p>
      </section>
    </main>
  );
}
