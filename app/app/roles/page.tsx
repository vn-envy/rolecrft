'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

type WorkspaceListItem = {
  id: string;
  role_title: string;
  company_name: string;
  updated_at: string;
};

export default function RolesHomePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);

  useEffect(() => {
    const run = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/');
        return;
      }

      const { data } = await supabase
        .from('role_workspaces')
        .select('id, role_title, company_name, updated_at')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      setWorkspaces(data ?? []);
      setLoading(false);
    };

    void run();
  }, [router, supabase]);

  if (loading) {
    return <main className="page-shell"><section className="card">Loading roles...</section></main>;
  }

  return (
    <main className="page-shell">
      <section className="card-elevated hero">
        <p className="kicker">Rolecrft App</p>
        <h1>Your role workspaces</h1>
        <p className="panel-copy">Start a new role or continue from your latest snapshot.</p>
        <Link className="btn btn-accent inline-btn" href="/app/roles/new">Create new workspace</Link>
      </section>

      <section className="card list-grid">
        {workspaces.length === 0 ? (
          <p className="panel-copy">No role workspaces yet.</p>
        ) : workspaces.map((workspace) => (
          <Link className="list-item" key={workspace.id} href={`/app/roles/${workspace.id}/snapshot`}>
            <h3>{workspace.role_title}</h3>
            <p>{workspace.company_name}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
