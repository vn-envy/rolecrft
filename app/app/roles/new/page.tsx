'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

type WorkspaceFormState = {
  roleTitle: string;
  companyName: string;
  roleUrl: string;
  jobDescription: string;
  resumeText: string;
  linkedinUrl: string;
};

const INITIAL_FORM_STATE: WorkspaceFormState = {
  roleTitle: '',
  companyName: '',
  roleUrl: '',
  jobDescription: '',
  resumeText: '',
  linkedinUrl: ''
};

function deriveSummary(text: string, fallback: string) {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) return fallback;
  return compact.length > 280 ? `${compact.slice(0, 280)}…` : compact;
}

export default function NewRoleWorkspacePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinPdf, setLinkedinPdf] = useState<File | null>(null);

  useEffect(() => {
    const ensureSession = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/');
        return;
      }

      setLoading(false);
    };

    void ensureSession();
  }, [router, supabase]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/');
      return;
    }

    if (!formState.resumeText.trim() && !resumeFile) {
      setMessage('Please upload a resume file or paste your resume text.');
      setSubmitting(false);
      return;
    }

    if (!formState.jobDescription.trim() && !formState.roleUrl.trim()) {
      setMessage('Please add a role link or paste the job description.');
      setSubmitting(false);
      return;
    }

    const { data: workspace, error: workspaceError } = await supabase
      .from('role_workspaces')
      .insert({
        owner_id: user.id,
        role_title: formState.roleTitle,
        company_name: formState.companyName,
        role_url: formState.roleUrl || null,
        stage: 'snapshot',
        status: 'active'
      })
      .select('id')
      .single();

    if (workspaceError || !workspace) {
      setMessage(workspaceError?.message ?? 'Unable to create workspace right now.');
      setSubmitting(false);
      return;
    }

    const sourceInserts = [];

    if (formState.resumeText.trim()) {
      sourceInserts.push({
        owner_id: user.id,
        workspace_id: workspace.id,
        source_type: 'resume_text',
        source_label: 'Pasted resume',
        source_payload: { text: formState.resumeText }
      });
    }

    if (resumeFile) {
      sourceInserts.push({
        owner_id: user.id,
        workspace_id: workspace.id,
        source_type: 'resume_upload',
        source_label: resumeFile.name,
        source_payload: {
          name: resumeFile.name,
          size: resumeFile.size,
          mimeType: resumeFile.type
        }
      });
    }

    if (formState.linkedinUrl.trim()) {
      sourceInserts.push({
        owner_id: user.id,
        workspace_id: workspace.id,
        source_type: 'linkedin_url',
        source_label: 'LinkedIn profile',
        source_url: formState.linkedinUrl,
        source_payload: {}
      });
    }

    if (linkedinPdf) {
      sourceInserts.push({
        owner_id: user.id,
        workspace_id: workspace.id,
        source_type: 'linkedin_pdf',
        source_label: linkedinPdf.name,
        source_payload: {
          name: linkedinPdf.name,
          size: linkedinPdf.size,
          mimeType: linkedinPdf.type
        }
      });
    }

    sourceInserts.push({
      owner_id: user.id,
      workspace_id: workspace.id,
      source_type: formState.jobDescription.trim() ? 'job_description_text' : 'job_description_link',
      source_label: formState.jobDescription.trim() ? 'Pasted job description' : 'Role link',
      source_url: formState.roleUrl || null,
      source_payload: formState.jobDescription.trim() ? { text: formState.jobDescription } : {}
    });

    const { error: sourceError } = await supabase.from('candidate_sources').insert(sourceInserts);

    if (sourceError) {
      setMessage(sourceError.message);
      setSubmitting(false);
      return;
    }

    const { error: candidateError } = await supabase.from('candidate_intelligence').upsert(
      {
        owner_id: user.id,
        workspace_id: workspace.id,
        summary: deriveSummary(
          formState.resumeText,
          'Candidate baseline captured. Resume analysis generation is queued for this workspace.'
        ),
        strengths: ['Resume source captured', 'Ready for role-tailored optimization'],
        gaps: ['Detailed candidate intelligence generation pending'],
        resume_text: formState.resumeText || null
      },
      { onConflict: 'owner_id,workspace_id' }
    );

    if (candidateError) {
      setMessage(candidateError.message);
      setSubmitting(false);
      return;
    }

    const { error: roleIntelError } = await supabase.from('role_intelligence').upsert(
      {
        owner_id: user.id,
        workspace_id: workspace.id,
        role_summary: deriveSummary(
          formState.jobDescription,
          `Role source captured for ${formState.roleTitle} at ${formState.companyName}.`
        ),
        hard_requirements: [],
        soft_requirements: [],
        company_signals: {}
      },
      { onConflict: 'owner_id,workspace_id' }
    );

    if (roleIntelError) {
      setMessage(roleIntelError.message);
      setSubmitting(false);
      return;
    }

    const { error: analysisError } = await supabase.from('match_analyses').insert({
      owner_id: user.id,
      workspace_id: workspace.id,
      score: 50,
      verdict: 'Baseline created — full fit analysis pending generation.',
      rationale: ['Inputs captured', 'Awaiting deeper matching pass'],
      recommendations: ['Open Output Studio to begin resume tailoring']
    });

    if (analysisError) {
      setMessage(analysisError.message);
      setSubmitting(false);
      return;
    }

    router.push(`/app/roles/${workspace.id}/snapshot`);
  };

  if (loading) {
    return <main className="page-shell"><section className="card">Loading...</section></main>;
  }

  return (
    <main className="page-shell">
      <section className="card-elevated">
        <p className="kicker">Phase 1 · Role Workspace</p>
        <h1>Create a new role workspace</h1>
        <p className="panel-copy">Resume-first intake with role context so you can move directly into snapshot and outputs.</p>
      </section>

      <form className="card form-grid" onSubmit={onSubmit}>
        <div className="split-grid">
          <label className="label">Role title
            <input className="input" required value={formState.roleTitle} onChange={(event) => setFormState((previous) => ({ ...previous, roleTitle: event.target.value }))} />
          </label>
          <label className="label">Company
            <input className="input" required value={formState.companyName} onChange={(event) => setFormState((previous) => ({ ...previous, companyName: event.target.value }))} />
          </label>
        </div>

        <label className="label">Resume upload (optional if you paste text)
          <input className="input" type="file" accept=".pdf,.doc,.docx,.txt" onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)} />
        </label>

        <label className="label">Resume text
          <textarea className="input textarea" rows={8} placeholder="Paste your resume content" value={formState.resumeText} onChange={(event) => setFormState((previous) => ({ ...previous, resumeText: event.target.value }))} />
        </label>

        <div className="split-grid">
          <label className="label">LinkedIn URL (optional)
            <input className="input" type="url" placeholder="https://www.linkedin.com/in/..." value={formState.linkedinUrl} onChange={(event) => setFormState((previous) => ({ ...previous, linkedinUrl: event.target.value }))} />
          </label>
          <label className="label">LinkedIn profile PDF (optional)
            <input className="input" type="file" accept=".pdf" onChange={(event) => setLinkedinPdf(event.target.files?.[0] ?? null)} />
          </label>
        </div>

        <label className="label">Role link (optional if you paste JD)
          <input className="input" type="url" placeholder="https://company.com/jobs/..." value={formState.roleUrl} onChange={(event) => setFormState((previous) => ({ ...previous, roleUrl: event.target.value }))} />
        </label>

        <label className="label">Job description text
          <textarea className="input textarea" rows={8} placeholder="Paste the role description" value={formState.jobDescription} onChange={(event) => setFormState((previous) => ({ ...previous, jobDescription: event.target.value }))} />
        </label>

        <button className="btn btn-accent" type="submit" disabled={submitting}>
          {submitting ? 'Creating workspace…' : 'Create workspace'}
        </button>

        {message ? <p className="feedback">{message}</p> : null}
      </form>
    </main>
  );
}
