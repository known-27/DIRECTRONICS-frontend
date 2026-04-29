'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { projectsApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner, ErrorState } from '@/components/ui/LoadingStates';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { useProtectedFile } from '@/hooks/useProtectedFile';
import { useNotifications } from '@/contexts/NotificationsContext';
import {
  ArrowLeft, CheckCircle, Calculator, HandCoins, Info,
  Maximize2, ImageOff, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import type { Project } from '@/types';

interface ApproveForm {
  totalProjectPrice: string;
  makingCost:        string;
  paymentMode:       'GST' | 'CASH';
  manualPayAmount?:  string;
  approvalNotes?:    string;
}

export default function ApproveProjectPage(): React.ReactElement {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const { refetch: refetchNotifications } = useNotifications();

  const [mode, setMode]           = useState<'formula' | 'manual'>('formula');
  const [apiError, setApiError]   = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data, isLoading, error } = useQuery<{ data: Project }>({
    queryKey: ['project', id],
    queryFn:  () => projectsApi.getById(id).then((r) => r.data),
  });

  const project = data?.data;

  // Pass the relative DB path directly — useProtectedFile fetches via authenticated axios
  const { objectUrl: jobCardUrl, loading: imageLoading } = useProtectedFile(project?.completionImageUrl ?? null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ApproveForm>({
    defaultValues: {
      totalProjectPrice: '',
      makingCost:        '0',
      paymentMode:       'GST',
      manualPayAmount:   '',
      approvalNotes:     '',
    },
  });

  const makingCostVal = watch('makingCost');
  const isManual      = parseFloat(makingCostVal || '0') === 0;

  const approveMutation = useMutation({
    mutationFn: (formData: ApproveForm) => {
      const payload = {
        totalProjectPrice: formData.totalProjectPrice,
        makingCost:        formData.makingCost,
        paymentMode:       formData.paymentMode,
        approvalNotes:     formData.approvalNotes,
        ...(isManual && formData.manualPayAmount ? { manualPayAmount: formData.manualPayAmount } : {}),
      };
      return projectsApi.approve(id, payload);
    },
    onSuccess: () => {
      // Immediately decrement the notification badge before navigating
      refetchNotifications();
      router.push('/admin/projects');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setApiError(err.response?.data?.message ?? 'Failed to approve project');
    },
  });

  if (isLoading) return <DashboardLayout><LoadingSpinner text="Loading project..." /></DashboardLayout>;
  if (error || !data || !project) return <DashboardLayout><ErrorState message="Failed to load project" /></DashboardLayout>;

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/projects" className="btn-ghost btn-sm"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="page-title">Approve Project</h1>
            <p className="page-subtitle">{project.invoiceNumber ?? '—'}  •  {project.projectName}</p>
          </div>
        </div>

        {/* ── PROJECT OVERVIEW ──────────────────────────────────────────── */}
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Project Overview
            </h2>
            <StatusBadge status={project.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left — project meta */}
            <div className="space-y-3">
              {([
                ['Employee',        project.employee?.name ?? '—'],
                ['Service',         project.service?.name ?? '—'],
                ['Invoice Number',  project.invoiceNumber ?? '—'],
                ['Project Name',    project.projectName],
                ['Start Date',      project.startDate ? fmt(project.startDate) : '—'],
                ['Finish Date',     project.finishDate ? fmt(project.finishDate) : '—'],
                ['Submitted',       project.updatedAt ? fmt(project.updatedAt) : '—'],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="text-sm font-medium text-right truncate" style={{ color: 'var(--text-primary)', maxWidth: '60%' }}>{value}</span>
                </div>
              ))}

              {project.notes && (
                <div className="flex gap-2 p-3 rounded-lg mt-1" style={{ background: 'var(--bg-elevated)' }}>
                  <Info size={14} style={{ color: 'var(--text-muted)' }} className="mt-0.5 shrink-0" />
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{project.notes}</p>
                </div>
              )}
            </div>

            {/* Right — job card image */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Job Card Image
              </p>

              {imageLoading && (
                <div className="flex items-center justify-center rounded-xl aspect-video" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-base)' }}>
                  <Loader2 size={24} className="text-blue-400 animate-spin" />
                </div>
              )}

              {!imageLoading && !jobCardUrl && (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl aspect-video" style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-muted)' }}>
                  <ImageOff size={28} style={{ color: 'var(--text-faint)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>No job card image uploaded</p>
                </div>
              )}

              {!imageLoading && jobCardUrl && (
                <div className="relative group rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-base)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={jobCardUrl}
                    alt="Job card thumbnail"
                    className="w-full object-contain"
                    style={{ maxHeight: '260px', background: 'var(--bg-elevated)' }}
                  />
                  {/* View full-size overlay on hover */}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ background: 'rgba(2,6,23,0.55)' }}
                    onClick={() => setLightboxOpen(true)}
                  >
                    <span className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' }}>
                      <Maximize2 size={16} />
                      View Full Size
                    </span>
                  </div>
                </div>
              )}

              {!imageLoading && jobCardUrl && (
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="btn-secondary btn-sm self-start"
                >
                  <Maximize2 size={14} />
                  Open Lightbox
                </button>
              )}
            </div>
          </div>

          {/* Project field values */}
          {project.details && project.details.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Service Fields</p>
              <div className="grid grid-cols-2 gap-2">
                {project.details.map((d) => (
                  <div key={d.id} className="card-sm">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.fieldKey}</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{d.fieldValue}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── DIVIDER ──────────────────────────────────────────────────── */}
        <div className="divider" />

        {/* Calc mode selector */}
        <div className="flex gap-3">
          <button
            onClick={() => setMode('formula')}
            className={`flex-1 flex items-center gap-2 p-3 rounded-xl border transition-all ${
              mode === 'formula' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : ''
            }`}
            style={{ borderColor: mode === 'formula' ? undefined : 'var(--border-base)' }}
          >
            <Calculator size={18} />
            <div className="text-left">
              <p className="font-semibold text-sm">Formula Engine</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Making Cost &gt; 0 → auto-calculate amount</p>
            </div>
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center gap-2 p-3 rounded-xl border transition-all ${
              mode === 'manual' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : ''
            }`}
            style={{ borderColor: mode === 'manual' ? undefined : 'var(--border-base)' }}
          >
            <HandCoins size={18} />
            <div className="text-left">
              <p className="font-semibold text-sm">Manual Pay</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Making Cost = 0 → enter amount directly</p>
            </div>
          </button>
        </div>

        {/* Approval Form */}
        <div className="card space-y-4">
          {apiError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
              {apiError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Total Project Price (₹) *</label>
              <input
                type="number" min="0" step="0.01"
                className={`input ${errors.totalProjectPrice ? 'input-error' : ''}`}
                placeholder="e.g. 50000"
                {...register('totalProjectPrice', { required: 'Required', min: { value: 0.01, message: 'Must be > 0' } })}
              />
              {errors.totalProjectPrice && <p className="text-xs text-red-400 mt-1">{errors.totalProjectPrice.message}</p>}
            </div>

            <div>
              <label className="label">Making Cost (₹) *</label>
              <input
                type="number" min="0" step="0.01"
                className={`input ${errors.makingCost ? 'input-error' : ''}`}
                placeholder={mode === 'manual' ? '0  (for manual pay)' : 'e.g. 30000'}
                {...register('makingCost', { required: 'Required' })}
              />
              {errors.makingCost && <p className="text-xs text-red-400 mt-1">{errors.makingCost.message}</p>}
            </div>
          </div>

          <div>
            <label className="label">Payment Mode *</label>
            <select className="select" {...register('paymentMode', { required: true })}>
              <option value="GST">GST</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          {/* Manual amount */}
          {(mode === 'manual' || isManual) && (
            <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-muted)', background: 'var(--bg-elevated)' }}>
              <label className="label">Manual Pay Amount (₹) *</label>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                Since Making Cost = 0, enter the exact amount to pay this employee.
              </p>
              <input
                type="number" min="0.01" step="0.01"
                className={`input ${errors.manualPayAmount ? 'input-error' : ''}`}
                placeholder="Enter exact pay amount"
                {...register('manualPayAmount', {
                  required: { value: isManual, message: 'Required when making cost is 0' },
                  min: { value: 0.01, message: 'Must be > 0' },
                })}
              />
              {errors.manualPayAmount && <p className="text-xs text-red-400 mt-1">{errors.manualPayAmount.message}</p>}
            </div>
          )}

          {!isManual && mode === 'formula' && (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <Calculator size={14} className="text-blue-400" />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                The formula engine will calculate the employee&apos;s payment using:
                <strong className="ml-1">margin = totalProjectPrice − makingCost</strong>, plus any project field values.
              </p>
            </div>
          )}

          <div>
            <label className="label">Approval Notes (optional)</label>
            <textarea
              className="textarea" rows={3}
              placeholder="Add any notes for this approval..."
              {...register('approvalNotes')}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Link href="/admin/projects" className="btn-secondary flex-1 text-center">Cancel</Link>
            <button
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              onClick={handleSubmit((d) => approveMutation.mutate(d))}
              disabled={isSubmitting || approveMutation.isPending}
            >
              <CheckCircle size={16} />
              {approveMutation.isPending ? 'Approving…' : 'Approve & Calculate'}
            </button>
          </div>
        </div>
      </div>

      {/* Job card lightbox */}
      {lightboxOpen && jobCardUrl && (
        <ImageLightbox
          src={jobCardUrl}
          fileName={`jobcard-${project.invoiceNumber ?? project.id}.png`}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </DashboardLayout>
  );
}
