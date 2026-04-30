'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, uploadsApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingSpinner, ErrorState } from '@/components/ui/LoadingStates';
import FileUpload from '@/components/ui/FileUpload';
import { ArrowLeft, Save, CheckCircle2, ArrowRight, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import type { Project } from '@/types';

export default function UpdateProjectPage(): React.ReactElement {
  const { id }  = useParams<{ id: string }>();
  const qc      = useQueryClient();
  const [finishDate, setFinishDate] = useState('');
  const [imageUrl, setImageUrl]     = useState<string | null>(null);
  const [apiError, setApiError]     = useState<string | null>(null);
  const [savedReady, setSavedReady] = useState(false);
  const [copied, setCopied]         = useState(false);

  const { data, isLoading, error } = useQuery<{ data: Project }>({
    queryKey: ['project', id],
    queryFn:  () => projectsApi.getById(id).then((r) => r.data),
  });

  // Set defaults from loaded project
  React.useEffect(() => {
    if (data?.data) {
      if (data.data.finishDate) setFinishDate(data.data.finishDate.split('T')[0]);
      if (data.data.completionImageUrl) setImageUrl(data.data.completionImageUrl);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: { finishDate: string; completionImageUrl?: string }) =>
      projectsApi.updateFinish(id, payload),
    onSuccess: async () => {
      // Refetch the project to get the server-computed isReadyForSubmission
      await qc.invalidateQueries({ queryKey: ['project', id] });
      const fresh = qc.getQueryData<{ data: Project }>(['project', id]);
      setSavedReady(fresh?.data?.isReadyForSubmission ?? false);
      setApiError(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setApiError(err.response?.data?.message ?? 'Failed to update project'),
  });

  if (isLoading) return <DashboardLayout><LoadingSpinner text="Loading project..." /></DashboardLayout>;
  if (error || !data) return <DashboardLayout><ErrorState message="Project not found" /></DashboardLayout>;

  const project = data.data;

  // Only allow editing DRAFT projects
  if (project.status !== 'DRAFT') {
    return (
      <DashboardLayout>
        <ErrorState message="This project has already been submitted and cannot be edited." />
      </DashboardLayout>
    );
  }
  const startDateStr = project.startDate.split('T')[0];

  // Format as DD-MM-YYYY for display (matching what the UI shows)
  const [y, m, d]    = startDateStr.split('-');
  const startDateDisplay = `${d}-${m}-${y}`;

  const copyStartDate = () => {
    navigator.clipboard.writeText(startDateDisplay).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Accept pasted dates in DD-MM-YYYY format (what the copy button copies)
  // and convert to YYYY-MM-DD required by <input type="date">
  const handleFinishDatePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const raw = e.clipboardData.getData('text').trim();
    // Match DD-MM-YYYY
    const match = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (match) {
      e.preventDefault();
      const converted = `${match[3]}-${match[2]}-${match[1]}`; // YYYY-MM-DD
      setFinishDate(converted);
    }
    // Otherwise let the browser handle it natively
  };

  const handleSave = () => {
    if (!finishDate) { setApiError('Please select a finish date'); return; }
    setSavedReady(false);
    updateMutation.mutate({ finishDate, ...(imageUrl ? { completionImageUrl: imageUrl } : {}) });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/employee/projects/${id}`} className="btn-ghost btn-sm"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="page-title">Update Project</h1>
            <p className="page-subtitle">{project.projectName}</p>
          </div>
        </div>

        {apiError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
            {apiError}
          </div>
        )}

        {/* ── Ready-to-submit banner ── */}
        {savedReady && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-4 animate-fade-in"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-400">
                Your project is now ready to submit for review!
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                All required fields are complete. You can now submit this project for admin approval.
              </p>
            </div>
            <Link
              href={`/employee/projects/${id}`}
              className="btn-success btn-sm flex-shrink-0 flex items-center gap-1.5"
            >
              View & Submit
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        <div className="card space-y-5">
          <div>
            <label className="label">Start Date</label>
            <div className="flex items-center gap-2">
              <div
                className="input bg-slate-800/50 flex-1 select-text cursor-text"
                style={{ userSelect: 'text' }}
              >
                {startDateDisplay}
              </div>
              <button
                type="button"
                onClick={copyStartDate}
                title="Copy start date"
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
                style={{
                  background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                  border:     copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  color:      copied ? '#34d399' : '#94a3b8',
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Set at project creation — cannot change</p>
          </div>

          <div>
            <label className="label">Finish Date *</label>
            <input
              type="date" className="input"
              min={startDateStr}
              max={new Date().toISOString().split('T')[0]}
              value={finishDate}
              onChange={(e) => setFinishDate(e.target.value)}
              onPaste={handleFinishDatePaste}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              You can paste a date in <span style={{ color: 'var(--text-subtle, #64748b)' }}>DD-MM-YYYY</span> format directly
            </p>
          </div>

          <FileUpload
            label="Completion Image (Job Card)"
            accept=".jpg,.jpeg,.png,.webp"
            maxSizeMB={10}
            previewType="image"
            currentUrl={imageUrl}
            onUpload={async (file) => {
              const res = await uploadsApi.uploadProjectImage(id, file);
              const url = (res.data as { data: { completionImageUrl: string } }).data.completionImageUrl;
              setImageUrl(url);
              return url;
            }}
          />

          <div className="flex gap-3 pt-2">
            <Link href={`/employee/projects/${id}`} className="btn-secondary flex-1 text-center">Cancel</Link>
            <button
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              <Save size={16} />
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
