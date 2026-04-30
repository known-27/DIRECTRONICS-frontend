'use client';

import React, { useState, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, usersApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui/LoadingStates';
import FilterBar from '@/components/ui/FilterBar';
import ExportPDFButton from '@/components/ui/ExportPDFButton';
import { PaymentDrawer } from '@/components/payments/PaymentDrawer';
import { CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import type { Payment, User, PaginatedData } from '@/types';
import { useFilterState } from '@/hooks/useFilterState';

function AdminPaymentsContent(): React.ReactElement {
  const qc = useQueryClient();
  const [filters, setFilters, clearFilters] = useFilterState('adm_payments');
  const [activePayment, setActive] = useState<Payment | null>(null);

  const { data, isLoading, error, refetch } = useQuery<{ data: PaginatedData<Payment> }>({
    queryKey: ['payments', filters],
    queryFn: () => paymentsApi.list(filters).then((r) => r.data),
  });

  const { data: usersData } = useQuery<{ data: User[] }>({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data),
  });

  const result = data?.data;
  const payments = result?.data ?? [];
  const employees = usersData?.data?.filter(u => u.role === 'EMPLOYEE') ?? [];
  const currentPage = Number(filters.page ?? 1);
  const setPage = (p: number) => setFilters({ ...filters, page: String(p) });

  const handleDrawerUpdate = (updated: Payment) => {
    // Optimistically patch the payment in the cache
    qc.setQueryData(['payments', filters], (old: { data: PaginatedData<Payment> } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        data: {
          ...old.data,
          data: old.data.data.map(p => p.id === updated.id ? updated : p),
        },
      };
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Payments</h1>
            <p className="page-subtitle">Track and manage employee payment instalments</p>
          </div>
          <ExportPDFButton
            filters={filters}
            onExport={async (f) => { const res = await paymentsApi.exportPdf(f); return res.data as Blob; }}
            fileName={`payments_${new Date().toISOString().split('T')[0]}.pdf`}
          />
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          statusOptions={['PENDING', 'PARTIAL', 'PAID', 'CANCELLED'].map(s => ({ value: s, label: s }))}
          employees={employees.map(e => ({ value: e.id, label: e.name }))}
          showPaymentMode
        />

        {isLoading && <LoadingSpinner text="Loading payments..." />}
        {error && <ErrorState message="Failed to load payments" onRetry={refetch} />}

        {!isLoading && payments.length === 0 && (
          <EmptyState
            title="No payments found"
            description="Payments appear when projects are approved"
            icon={<CreditCard size={40} />}
          />
        )}

        {payments.length > 0 && (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Project / Service</th>
                    <th>Calculated</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th>Txns</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="cursor-pointer" onClick={() => setActive(p)}>
                      <td className="font-semibold text-slate-200">{p.employee?.name ?? '—'}</td>
                      <td className="text-slate-400">
                        <div>{p.project?.projectName ?? '—'}</div>
                        <div className="text-xs text-slate-600">{p.project?.service?.name}</div>
                      </td>
                      <td className="text-slate-300 font-medium">{formatCurrency(p.calculatedAmount)}</td>
                      <td className="text-emerald-400 font-semibold">{formatCurrency(p.totalPaid)}</td>
                      <td className="text-amber-400 font-semibold">{formatCurrency(p.pendingAmount)}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="text-slate-500 text-xs">{p._count?.transactions ?? 0}</td>
                      <td>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActive(p); }}
                          className="btn btn-secondary btn-sm"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result && result.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Showing {(currentPage - 1) * Number(filters.limit ?? 20) + 1}-{Math.min(currentPage * Number(filters.limit ?? 20), result.total)} of {result.total}
                </p>
                <div className="flex gap-2">
                  {Array.from({ length: result.totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - currentPage) <= 2)
                    .map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className={p === currentPage ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}>{p}</button>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment Drawer */}
      {activePayment && (
        <PaymentDrawer
          payment={activePayment}
          onClose={() => setActive(null)}
          onUpdate={handleDrawerUpdate}
        />
      )}
    </DashboardLayout>
  );
}

export default function AdminPaymentsPage(): React.ReactElement {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading payments..." />}>
      <AdminPaymentsContent />
    </Suspense>
  );
}
