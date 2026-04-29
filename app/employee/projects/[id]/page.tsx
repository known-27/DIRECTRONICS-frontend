'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner, ErrorState } from '@/components/ui/LoadingStates';
import { ChevronRight, CheckCircle, Clock, Send, XCircle, Pencil, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import type { Project, ProjectStatus } from '@/types';
import type { AxiosError } from 'axios';
import { formatCurrency } from '@/lib/formatCurrency';

const STATUS_STEPS: ProjectStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED', 'PAID'];

export default function ProjectDetailPage({ params }: { params: { id: string } }): React.ReactElement {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [actionNote, setActionNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{ data: Project }>({
    queryKey: ['project', params.id],
    queryFn: () => projectsApi.getById(params.id).then(r => r.data),
  });

  const submitMutation = useMutation({
    mutationFn: () => projectsApi.submit(params.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', params.id] }); setActionError(null); },
    onError: (err: AxiosError<{ message: string }>) => setActionError(err.response?.data?.message ?? 'Failed to submit'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
      projectsApi.updateStatus(params.id, { status, notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['project', params.id] }); setActionNote(''); setActionError(null); },
    onError: (err: AxiosError<{ message: string }>) => setActionError(err.response?.data?.message ?? 'Action failed'),
  });

  const project = data?.data;

  const getStepIcon = (s: ProjectStatus, current: ProjectStatus): React.ReactElement => {
    const idx = STATUS_STEPS.indexOf(s);
    const curIdx = STATUS_STEPS.indexOf(current === 'REJECTED' ? 'SUBMITTED' : current);
    if (current === 'REJECTED' && s === 'SUBMITTED') return <XCircle size={18} className="text-red-400" />;
    if (idx < curIdx) return <CheckCircle size={18} className="text-emerald-400" />;
    if (idx === curIdx) return <Clock size={18} className="text-blue-400" />;
    return <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-700" />;
  };

  return (
    <DashboardLayout>
      {isLoading && <LoadingSpinner text="Loading project..." />}
      {error && <ErrorState message="Failed to load project" />}

      {project && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="page-title">{project.service?.name} Project</h1>
                <StatusBadge status={project.status} />
              </div>
              <p className="page-subtitle">
                {user?.role === 'ADMIN' ? `By ${project.employee?.name} · ` : ''}
                Created {new Date(project.createdAt).toLocaleString()}
              </p>
            </div>
            {/* Calculated Amount */}
            {project.calculatedAmount && (
              <div className="text-right">
                <p className="text-xs text-slate-500">Calculated Amount</p>
                <p className="text-3xl font-bold text-emerald-400">₹{Number(project.calculatedAmount).toLocaleString()}</p>
              </div>
            )}
          </div>

          {actionError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
              {actionError}
            </div>
          )}

          {/* Status Timeline */}
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Status Timeline</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    {getStepIcon(s, project.status)}
                    <span className={`text-sm font-medium ${project.status === s ? 'text-blue-400' : STATUS_STEPS.indexOf(project.status) > i ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {s}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && <ChevronRight size={14} className="text-slate-700" />}
                </React.Fragment>
              ))}
              {project.status === 'REJECTED' && (
                <>
                  <ChevronRight size={14} className="text-slate-700" />
                  <div className="flex items-center gap-2">
                    <XCircle size={18} className="text-red-400" />
                    <span className="text-sm font-medium text-red-400">REJECTED</span>
                  </div>
                </>
              )}
            </div>
            {project.notes && (
              <div className="mt-4 bg-slate-800/50 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-500">Notes:</p>
                <p className="text-sm text-slate-300 mt-1">{project.notes}</p>
              </div>
            )}
          </div>

          {/* Field Values */}
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

          {/* Formula Used */}
          {project.formulaSnapshot && (
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Formula Used (Snapshot)</h2>
              <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 font-mono text-sm text-blue-300">
                {project.formulaSnapshot.expression}
              </div>
              <p className="text-xs text-slate-600 mt-2">Captured at: {new Date(project.formulaSnapshot.snapshotAt).toLocaleString()}</p>
            </div>
          )}

          {/* Payment Info */}
          {project.payments && project.payments.length > 0 && (
          <div className="card">
              <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Payment</h2>
              {project.payments.map((pay) => (
                <div key={pay.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={pay.status} />
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(pay.calculatedAmount)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">Calculated</p>
                      <p className="font-semibold text-slate-300 mt-0.5">{formatCurrency(pay.calculatedAmount)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Received</p>
                      <p className="font-semibold text-emerald-400 mt-0.5">{formatCurrency(pay.totalPaid)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Pending</p>
                      <p className="font-semibold text-amber-400 mt-0.5">{formatCurrency(pay.pendingAmount)}</p>
                    </div>
                  </div>
                  {pay.paidAt && <p className="text-xs text-slate-500">Fully paid: {new Date(pay.paidAt).toLocaleDateString()}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Actions</h2>

            {/* Employee: Submit */}
            {user?.role === 'EMPLOYEE' && project.status === 'DRAFT' && (
              <div className="space-y-3">
                {/* Show what's missing when project isn't ready */}
                {!project.isReadyForSubmission && (
                  <div
                    className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
                  >
                    <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-500">Before you can submit, complete the following:</p>
                      <ul className="mt-1.5 space-y-1" style={{ color: 'var(--text-secondary)' }}>
                        {!project.finishDate && (
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                            Set a <strong>Finish Date</strong> on the project
                          </li>
                        )}
                        {!project.completionImageUrl && (
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                            Upload a <strong>Job Card Image</strong>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {/* Edit / Save as Draft */}
                  <Link
                    href={`/employee/projects/${project.id}/update`}
                    className="btn-secondary flex-1 justify-center"
                  >
                    <Pencil size={16} />
                    Edit Project
                  </Link>

                  {/* Submit for Review — gated */}
                  <button
                    onClick={() => submitMutation.mutate()}
                    disabled={!project.isReadyForSubmission || submitMutation.isPending}
                    className="btn-primary flex-1"
                    title={!project.isReadyForSubmission
                      ? [
                          !project.finishDate       ? 'finish date is missing'      : '',
                          !project.completionImageUrl ? 'job card image is missing' : '',
                        ].filter(Boolean).join(' · ')
                      : 'Submit this project for admin review'
                    }
                  >
                    <Send size={16} />
                    {submitMutation.isPending ? 'Submitting…' : 'Submit for Review'}
                  </button>
                </div>
              </div>
            )}

            {/* Admin: Approve / Reject */}
            {user?.role === 'ADMIN' && project.status === 'SUBMITTED' && (
              <>
                <div>
                  <label className="label">Notes (optional)</label>
                  <textarea className="textarea" rows={2} placeholder="Decision notes..." value={actionNote} onChange={e => setActionNote(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => statusMutation.mutate({ status: 'APPROVED', notes: actionNote })} disabled={statusMutation.isPending} className="btn-success flex-1">
                    <CheckCircle size={18} /> Approve
                  </button>
                  <button onClick={() => statusMutation.mutate({ status: 'REJECTED', notes: actionNote })} disabled={statusMutation.isPending} className="btn-danger flex-1">
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              </>
            )}

            {(project.status === 'PAID' || (project.status !== 'DRAFT' && user?.role === 'EMPLOYEE')) && (
              <p className="text-sm text-slate-500 text-center">No actions available at this stage.</p>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
