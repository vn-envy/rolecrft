'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

const tabs = ['Resume Module', 'STAR / SOARR', 'Keywords', 'Role Rationale'] as const;
type OutputTab = (typeof tabs)[number];

export default function WorkspaceOutputsPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OutputTab>('Resume Module');

  useEffect(() => {
    const run = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/');
        return;
      }

      const { data: workspace } = await supabase
        .from('role_workspaces')
        .select('id')
        .eq('id', params.workspaceId)
        .eq('owner_id', user.id)
        .single();

      if (!workspace) {
        router.replace('/app/roles');
        return;
      }

      setLoading(false);
    };

    void run();
  }, [params.workspaceId, router, supabase]);

  if (loading) {
    return <main className="page-shell"><section className="card">Loading Output Studio...</section></main>;
  }

  return (
    <main className="page-shell">
      <section className="card-elevated">
        <p className="kicker">Output Studio</p>
        <h1>Workspace outputs</h1>
        <p className="panel-copy">Your resume workflow remains available, with additional role-aware outputs staged for Phase 1.</p>
      </section>

      <section className="card tab-row">
        {tabs.map((tabName) => (
          <button key={tabName} className={`tab-btn ${tab === tabName ? 'active' : ''}`} onClick={() => setTab(tabName)}>
            {tabName}
          </button>
        ))}
      </section>

      <section className="card">
        {tab === 'Resume Module' ? (
          <div className="stack-gap">
            <p>
              The existing resume module is preserved. Continue using the established resume editing flow while this new
              workspace routing and data model comes online.
            </p>
            <p className="panel-copy">Resume generation wiring to this workspace is intentionally deferred for a safe Phase 1 cut.</p>
          </div>
        ) : (
          <p className="panel-copy">{tab} output scaffolding is ready. Content generation will be connected in a follow-on phase.</p>
        )}
      </section>

      <Link className="btn btn-secondary inline-btn" href={`/app/roles/${params.workspaceId}/snapshot`}>
        Back to snapshot
      </Link>
    </main>
  );
}
