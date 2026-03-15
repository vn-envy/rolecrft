'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

type SnapshotState = {
  roleTitle: string;
  companyName: string;
  candidateSummary: string;
  roleSummary: string;
  verdict: string;
  score: number;
  strengths: string[];
  gaps: string[];
};

export default function WorkspaceSnapshotPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<SnapshotState | null>(null);

  useEffect(() => {
    const run = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/');
        return;
      }

      const workspaceId = params.workspaceId;

      const [{ data: workspace }, { data: candidate }, { data: roleIntel }, { data: analysis }] = await Promise.all([
        supabase
          .from('role_workspaces')
          .select('role_title, company_name')
          .eq('id', workspaceId)
          .eq('owner_id', user.id)
          .single(),
        supabase
          .from('candidate_intelligence')
          .select('summary, strengths, gaps')
          .eq('workspace_id', workspaceId)
          .eq('owner_id', user.id)
          .maybeSingle(),
        supabase
          .from('role_intelligence')
          .select('role_summary')
          .eq('workspace_id', workspaceId)
          .eq('owner_id', user.id)
          .maybeSingle(),
        supabase
          .from('match_analyses')
          .select('score, verdict')
          .eq('workspace_id', workspaceId)
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      if (!workspace) {
        router.replace('/app/roles');
        return;
      }

      setSnapshot({
        roleTitle: workspace.role_title,
        companyName: workspace.company_name,
        candidateSummary: candidate?.summary ?? 'Candidate baseline captured. Deeper summary will appear after generation.',
        roleSummary: roleIntel?.role_summary ?? 'Role summary pending generation.',
        verdict: analysis?.verdict ?? 'Fit analysis pending.',
        score: analysis?.score ?? 50,
        strengths: Array.isArray(candidate?.strengths) ? candidate.strengths : ['Strength detection pending'],
        gaps: Array.isArray(candidate?.gaps) ? candidate.gaps : ['Gap detection pending']
      });
      setLoading(false);
    };

    void run();
  }, [params.workspaceId, router, supabase]);

  if (loading || !snapshot) {
    return <main className="page-shell"><section className="card">Building your snapshot...</section></main>;
  }

  return (
    <main className="page-shell">
      <section className="card-elevated">
        <p className="kicker">Role Snapshot</p>
        <h1>{snapshot.roleTitle} · {snapshot.companyName}</h1>
        <p className="panel-copy">First-value workspace view powered by your resume and role intake.</p>
      </section>

      <section className="card metric-grid">
        <article>
          <p className="label">Fit verdict</p>
          <h2>{snapshot.verdict}</h2>
          <p className="panel-copy">Current baseline score: <strong>{snapshot.score}/100</strong></p>
        </article>
        <article>
          <p className="label">Candidate summary</p>
          <p>{snapshot.candidateSummary}</p>
        </article>
        <article>
          <p className="label">Role summary</p>
          <p>{snapshot.roleSummary}</p>
        </article>
      </section>

      <section className="card split-grid">
        <article>
          <p className="label">Strengths</p>
          <ul>
            {snapshot.strengths.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
        <article>
          <p className="label">Gaps</p>
          <ul>
            {snapshot.gaps.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
      </section>

      <Link className="btn btn-accent inline-btn" href={`/app/roles/${params.workspaceId}/outputs`}>
        Continue to Output Studio
      </Link>
    </main>
  );
}
