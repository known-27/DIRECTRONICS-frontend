'use client';

// Admin project detail — reuses the same component logic but from admin's perspective
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner, ErrorState } from '@/components/ui/LoadingStates';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { ChevronRight, CheckCircle, Clock, XCircle, DollarSign, User } from 'lucide-react';
import Link from 'next/link';
import type { AdminProject, ProjectStatus } from '@/types';
import type { AxiosError } from 'axios';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { ImageIcon } from 'lucide-react';

const STATUS_STEPS: ProjectStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED', 'PAID'];

const fmt = (val: string | number | null | undefined): string => {
  if (val == null) return '—';
  const n = Number(val);
  if (isNaN(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

function PricingRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-base)' }}>
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-emerald-400' : ''}`} style={!highlight ? { color: 'var(--text-primary)' } : {}}>
        {value}
      </span>
    </div>
  );
}

export default function AdminProjectDetailPage({ params }: { params: { id: string } }): React.ReactElement {
  const qc = useQueryClient();
  const [actionNote, setActionNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{ data: AdminProject }>({
    queryKey: ['project', params.id],
    queryFn: () => projectsApi.getById(params.id).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
      projectsApi.updateStatus(params.id, { status, notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', params.id] }); setActionNote(''); setActionError(null); },
    onError: (err: AxiosError<{ message: string }>) => setActionError(err.response?.data?.message ?? 'Action failed'),
  });

  const project = data?.data;

  const showPricing =
    project?.status === 'APPROVED' || project?.status === 'PAID';

  return (
    <DashboardLayout>
      {isLoading && <LoadingSpinner text="Loading project..." />}
      {error && <ErrorState message="Failed to load project" />}

      {project && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="page-title">{project.service?.name}</h1>
                <StatusBadge status={project.status} />
              </div>
              <div className="flex items-center gap-2">
                <ProfileAvatar
                  profilePictureUrl={project.employee?.profilePictureUrl}
                  fullName={project.employee?.fullName ?? project.employee?.name ?? 'Employee'}
                  size="xs"
                />
                <p className="page-subtitle">By {project.employee?.name} · {new Date(project.createdAt).toLocaleString()}</p>
              </div>
            </div>
            {project.calculatedAmount && (
              <div className="text-right">
                <p className="text-xs text-slate-500">Amount</p>
                <p className="text-3xl font-bold text-emerald-400">₹{Number(project.calculatedAmount).toLocaleString('en-IN')}</p>
              </div>
            )}
          </div>

          {actionError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{actionError}</div>}

          {/* Status Timeline */}
          <div className="card">
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_STEPS.map((s, i) => {
                const curIdx = STATUS_STEPS.indexOf(project.status === 'REJECTED' ? 'SUBMITTED' : project.status);
                const idx = STATUS_STEPS.indexOf(s);
                return (
                  <React.Fragment key={s}>
                    <div className="flex items-center gap-2">
                      {project.status === 'REJECTED' && s === 'SUBMITTED' ? <XCircle size={18} className="text-red-400" /> :
                        idx < curIdx ? <CheckCircle size={18} className="text-emerald-400" /> :
                        idx === curIdx ? <Clock size={18} className="text-blue-400" /> :
                        <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-700" />}
                      <span className={`text-sm font-medium ${project.status === s ? 'text-blue-400' : idx < curIdx ? 'text-emerald-400' : 'text-slate-600'}`}>{s}</span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && <ChevronRight size={14} className="text-slate-700" />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ── Pricing Summary (ADMIN only, APPROVED/PAID) ─────────────────── */}
          {showPricing && (
            <div className="card" style={{ borderColor: 'var(--border-accent, #2563eb33)' }}>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={16} className="text-emerald-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pricing Summary</h2>
              </div>

              {project.totalProjectPrice != null && Number(project.totalProjectPrice) > 0 && (
                <PricingRow label="Total Project Price" value={fmt(project.totalProjectPrice)} />
              )}
              {project.makingCost != null && Number(project.makingCost) > 0 && (
                <PricingRow label="Making Cost" value={fmt(project.makingCost)} />
              )}
              {project.manualPayAmount != null && Number(project.manualPayAmount) > 0 && (
                <PricingRow label="Manual Pay Override" value={fmt(project.manualPayAmount)} />
              )}

              <PricingRow label="Calculated Payout" value={fmt(project.calculatedAmount)} highlight />

              {project.paymentMode && (
                <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-base)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Payment Mode</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400">
                    {project.paymentMode}
                  </span>
                </div>
              )}

              {/* Approval info */}
              {(project.approvedBy || project.approvedAt) && (
                <div className="flex items-center gap-2 pt-3 mt-1">
                  <User size={13} style={{ color: 'var(--text-faint)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    Approved by{' '}
                    <span className="font-medium" style={{ color: 'var(--text-muted)' }}>
                      {project.approvedBy?.fullName ?? project.approvedBy?.name ?? 'Admin'}
                    </span>
                    {project.approvedAt && (
                      <> · {new Date(project.approvedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Approval Notes */}
          {project.approvalNotes && (
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Approval Notes</h2>
              <blockquote className="border-l-2 border-blue-500/40 pl-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {project.approvalNotes}
              </blockquote>
            </div>
          )}

          {/* Fields */}
          {project.details && project.details.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Project Fields</h2>
              <div className="grid grid-cols-2 gap-3">
                {project.details.map((d) => {
                  const fieldDef = (project.service?.fields as Array<{ key: string; label: string }> | undefined)?.find(f => f.key === d.fieldKey);
                  return (
                    <div key={d.id} className="card-sm">
                      <p className="text-xs text-slate-500">{fieldDef?.label ?? d.fieldKey}</p>
                      <p className="text-sm font-medium text-slate-200 mt-0.5">{d.fieldValue}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Job Card / Completion Image */}
          {project.completionImageUrl ? (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon size={15} className="text-blue-400" />
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Job Card / Completion Image</h2>
              </div>
              <ProtectedImage
                src={project.completionImageUrl}
                alt="Job card completion image"
                className="w-full rounded-lg object-contain max-h-96 border border-slate-800 bg-slate-950"
              />
              {project.finishDate && (
                <p className="text-xs text-slate-500 mt-2">
                  Completed: {new Date(project.finishDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          ) : (
            project.status !== 'DRAFT' && (
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon size={15} className="text-slate-600" />
                  <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Job Card / Completion Image</h2>
                </div>
                <p className="text-sm text-slate-600 italic">No completion image uploaded yet.</p>
              </div>
            )
          )}

          {/* Formula Snapshot */}
          {project.formulaSnapshot && (
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Formula Snapshot</h2>
              <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 font-mono text-sm text-blue-300">
                {project.formulaSnapshot.expression}
              </div>
            </div>
          )}

          {/* Admin Actions */}
          {project.status === 'SUBMITTED' && (
            <div className="card space-y-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Admin Actions</h2>
              <div>
                <label className="label">Rejection Notes (optional)</label>
                <textarea className="textarea" rows={3} value={actionNote} onChange={e => setActionNote(e.target.value)} placeholder="Reason for rejection..." />
              </div>
              <div className="flex gap-3">
                {/* Approve → redirect to dedicated page that collects financial data */}
                <Link
                  href={`/admin/projects/${params.id}/approve`}
                  className="btn-success flex-1 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Approve Project
                </Link>
                {/* Reject → uses updateStatus endpoint (REJECTED is a valid value) */}
                <button
                  onClick={() => statusMutation.mutate({ status: 'REJECTED', notes: actionNote })}
                  disabled={statusMutation.isPending}
                  className="btn-danger flex-1"
                >
                  <XCircle size={18} /> Reject Project
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
