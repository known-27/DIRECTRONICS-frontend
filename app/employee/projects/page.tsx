'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, servicesApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner, EmptyState } from '@/components/ui/LoadingStates';
import { Modal } from '@/components/ui/Modal';
import FilterBar from '@/components/ui/FilterBar';
import ExportPDFButton from '@/components/ui/ExportPDFButton';
import { FolderKanban, Plus, Trash2, Eye, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Project, Service, PaginatedData, FilterState } from '@/types';
import { formatCurrency } from '@/lib/formatCurrency';
import { useFilterState } from '@/hooks/useFilterState';

export default function EmployeeProjectsPage(): React.ReactElement {
  const qc = useQueryClient();
  const [filters, setFilters, clearFilters] = useFilterState('emp_projects');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const { data, isLoading } = useQuery<{ data: PaginatedData<Project> }>({
    queryKey: ['my-projects', filters],
    queryFn:  () => projectsApi.list(filters).then(r => r.data),
  });

  const { data: servicesData } = useQuery<{ data: Service[] }>({
    queryKey: ['services-all'],
    queryFn:  () => servicesApi.list(true).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-projects'] });
      setDeleteTarget(null);
    },
  });

  const result   = data?.data;
  const projects = result?.data ?? [];
  const services = servicesData?.data ?? [];
  const currentPage = Number(filters.page ?? 1);
  const setPage = (p: number) => setFilters(f => ({ ...f, page: String(p) }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">My Projects</h1>
            <p className="page-subtitle">All your project submissions and their status</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportPDFButton
              filters={filters}
              onExport={async (f) => { const res = await projectsApi.exportPdf(f); return res.data as Blob; }}
              fileName={`my_projects_${new Date().toISOString().split('T')[0]}.pdf`}
            />
            <Link href="/employee/create-project" className="btn-primary">
              <Plus size={18} /> New Project
            </Link>
          </div>
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          statusOptions={['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID'].map(s => ({ value: s, label: s }))}
          services={services.map(s => ({ value: s.id, label: s.name }))}
        />

        {isLoading && <LoadingSpinner text="Loading your projects..." />}

        {!isLoading && projects.length === 0 && (
          <EmptyState
            title="No projects yet"
            description="Create your first project to start tracking your work and earnings"
            action={<Link href="/employee/create-project" className="btn-primary">Create Project</Link>}
            icon={<FolderKanban size={40} />}
          />
        )}

        {projects.length > 0 && (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th><th>Project</th><th>Service</th>
                    <th>Amount</th><th>Status</th><th>Payment</th>
                    <th>Start Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{p.invoiceNumber ?? '—'}</td>
                      <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.projectName || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.service?.name ?? '—'}</td>
                      <td>
                        {p.calculatedAmount != null
                          ? <span className="text-emerald-400 font-semibold">{formatCurrency(p.calculatedAmount)}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>Pending</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusBadge status={p.status} />
                          {p.status === 'DRAFT' && (
                            <span
                              className={p.isReadyForSubmission ? 'badge badge-green' : 'badge badge-yellow'}
                              title={p.isReadyForSubmission
                                ? 'All required fields are complete — ready to submit'
                                : `Incomplete: ${[
                                    !p.finishDate ? 'finish date' : '',
                                    !p.completionImageUrl ? 'job card image' : '',
                                  ].filter(Boolean).join(', ')} missing`
                              }
                            >
                              {p.isReadyForSubmission ? '● Ready' : '● Incomplete'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {p.payments && p.payments.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <StatusBadge status={p.payments[0].status} />
                            {p.payments[0].status !== 'PENDING' && (
                              <span className="text-xs text-slate-500">
                                {formatCurrency(p.payments[0].totalPaid)} paid
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(p.startDate).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Link href={`/employee/projects/${p.id}`} className="btn-ghost btn-sm"><Eye size={14} /></Link>
                          {p.status === 'DRAFT' && (
                            <Link href={`/employee/projects/${p.id}/update`} className="btn-ghost btn-sm"><Pencil size={14} /></Link>
                          )}
                          {p.status === 'DRAFT' && (
                            <button onClick={() => setDeleteTarget(p)} className="btn-danger btn-sm">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {result && result.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Showing {(currentPage - 1) * Number(filters.limit ?? 20) + 1}–{Math.min(currentPage * Number(filters.limit ?? 20), result.total)} of {result.total}
                </p>
                <div className="flex gap-2">
                  <button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="btn-ghost btn-sm">
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: result.totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - currentPage) <= 2)
                    .map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={p === currentPage ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}>{p}</button>
                    ))}
                  <button disabled={currentPage >= result.totalPages} onClick={() => setPage(currentPage + 1)} className="btn-ghost btn-sm">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Draft Project"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete Draft'}
            </button>
          </>
        }
      >
        {deleteTarget && (
          <div className="space-y-3">
            <p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to delete this draft project?</p>
            <div className="card-sm">
              <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Project:</span>{' '}
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{deleteTarget.projectName}</span></p>
              <p className="text-sm mt-1"><span style={{ color: 'var(--text-muted)' }}>Service:</span>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{deleteTarget.service?.name}</span></p>
            </div>
            <p className="text-xs text-red-400">This action cannot be undone.</p>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
