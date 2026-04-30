'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi, usersApi, servicesApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui/LoadingStates';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import FilterBar from '@/components/ui/FilterBar';
import ExportPDFButton from '@/components/ui/ExportPDFButton';
import { FolderKanban, Eye, CheckSquare, XSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Project, User, Service, PaginatedData } from '@/types';
import type { AxiosError } from 'axios';
import { useFilterState } from '@/hooks/useFilterState';

export default function AdminProjectsPage(): React.ReactElement {
  const qc = useQueryClient();
  const [filters, setFilters, clearFilters] = useFilterState('adm_projects');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery<{ data: PaginatedData<Project> }>({
    queryKey: ['projects', filters],
    queryFn:  () => projectsApi.list(filters).then((r) => r.data),
  });

  const { data: usersData }    = useQuery<{ data: User[] }>({ queryKey: ['users'], queryFn: () => usersApi.list().then(r => r.data) });
  const { data: servicesData } = useQuery<{ data: Service[] }>({ queryKey: ['services-all'], queryFn: () => servicesApi.list(true).then(r => r.data) });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => projectsApi.updateStatus(id, { status: 'REJECTED' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setActionError(null); },
    onError: (err: AxiosError<{ message: string }>) => setActionError(err.response?.data?.message ?? 'Action failed'),
  });

  const result     = data?.data;
  const projects   = result?.data ?? [];
  const employees  = usersData?.data?.filter(u => u.role === 'EMPLOYEE') ?? [];
  const services   = servicesData?.data ?? [];

  const setPage = (p: number) => setFilters(f => ({ ...f, page: String(p) }));
  const currentPage = Number(filters.page ?? 1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">All Projects</h1>
            <p className="page-subtitle">Review, approve, and manage employee project submissions</p>
          </div>
          <ExportPDFButton
            filters={filters}
            onExport={async (f) => {
              const res = await projectsApi.exportPdf(f);
              return res.data as Blob;
            }}
            fileName={`projects_${new Date().toISOString().split('T')[0]}.pdf`}
          />
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          statusOptions={['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID'].map(s => ({ value: s, label: s }))}
          employees={employees.map(e => ({ value: e.id, label: e.name }))}
          services={services.map(s => ({ value: s.id, label: s.name }))}
          showPaymentMode
        />

        {actionError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-sm text-red-400">
            {actionError}
          </div>
        )}

        {isLoading && <LoadingSpinner text="Loading projects..." />}
        {error && <ErrorState message="Failed to load projects" onRetry={refetch} />}

        {!isLoading && projects.length === 0 && (
          <EmptyState title="No projects found" description="Projects will appear here once employees create them" icon={<FolderKanban size={40} />} />
        )}

        {projects.length > 0 && (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th><th>Project</th><th>Employee</th><th>Service</th>
                    <th>Pay Mode</th><th>Amount</th><th>Status</th><th>Created</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{p.invoiceNumber ?? '—'}</td>
                      <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.projectName || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-2">
                          <ProfileAvatar
                            profilePictureUrl={p.employee?.profilePictureUrl}
                            fullName={p.employee?.fullName ?? p.employee?.name ?? 'Employee'}
                            size="xs"
                          />
                          {p.employee?.name ?? '—'}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.service?.name ?? '—'}</td>
                      <td>
                        {p.paymentMode
                          ? <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--bg-elevated)' }}>{p.paymentMode}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td>
                        {p.calculatedAmount != null
                          ? <span className="text-emerald-400 font-semibold">₹{Number(p.calculatedAmount).toLocaleString('en-IN')}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(p.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Link href={`/admin/projects/${p.id}`} className="btn-ghost btn-sm">
                            <Eye size={14} />
                          </Link>
                          {p.status === 'SUBMITTED' && (
                            <>
                              <Link href={`/admin/projects/${p.id}/approve`} className="btn-success btn-sm flex items-center gap-1">
                                <CheckSquare size={13} /> Approve
                              </Link>
                              <button onClick={() => rejectMutation.mutate(p.id)} className="btn-danger btn-sm">
                                <XSquare size={13} />
                              </button>
                            </>
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
                  Showing {(currentPage - 1) * Number(filters.limit ?? 20) + 1}–{Math.min(currentPage * Number(filters.limit ?? 20), result.total)} of {result.total} projects
                </p>
                <div className="flex gap-2">
                  <button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="btn-ghost btn-sm">
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: result.totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - currentPage) <= 2)
                    .map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={p === currentPage ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}>
                        {p}
                      </button>
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
    </DashboardLayout>
  );
}
