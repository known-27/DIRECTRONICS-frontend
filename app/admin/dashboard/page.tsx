'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner, ErrorState } from '@/components/ui/LoadingStates';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  FolderKanban, Users, CreditCard, Clock, ArrowUpRight, AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import type { AdminDashboard } from '@/types';

const KPICard = ({ title, value, subtitle, icon: Icon, color }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}): React.ReactElement => (
  <div className="kpi-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-slate-100 mt-2">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);

export default function AdminDashboard(): React.ReactElement {
  const { data, isLoading, error, refetch } = useQuery<{ data: AdminDashboard }>({
    queryKey: ['admin-dashboard'],
    queryFn: () => dashboardApi.admin().then((r) => r.data),
  });

  const dashboard = data?.data;
  const { user }  = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <ProfileAvatar
            profilePictureUrl={user?.profilePictureUrl}
            fullName={user?.fullName ?? user?.name ?? 'Admin'}
            size="lg"
          />
          <div>
            <h1 className="page-title">Welcome, {user?.name?.split(' ')[0] ?? 'Admin'}</h1>
            <p className="page-subtitle">DIRECTRONICS ServiceFlow Overview</p>
          </div>
        </div>

        {isLoading && <LoadingSpinner text="Loading dashboard..." />}
        {error && <ErrorState message="Failed to load dashboard" onRetry={refetch} />}

        {dashboard && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <KPICard
                title="Total Projects"
                value={dashboard.kpis.totalProjects}
                icon={FolderKanban}
                color="bg-blue-500/10 text-blue-400"
              />
              <KPICard
                title="Active Employees"
                value={dashboard.kpis.totalEmployees}
                icon={Users}
                color="bg-emerald-500/10 text-emerald-400"
              />
              <KPICard
                title="Partial Payments"
                value={dashboard.kpis.partialPaymentsCount}
                subtitle={`${dashboard.kpis.pendingPaymentsCount} fully pending`}
                icon={Clock}
                color="bg-orange-500/10 text-orange-400"
              />
              <KPICard
                title="Total Paid Out"
                value={formatCurrency(dashboard.kpis.totalPaidAmount)}
                icon={CreditCard}
                color="bg-purple-500/10 text-purple-400"
              />
            </div>

            {/* Total Pending to Pay — global outstanding liability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div
                className="kpi-card col-span-1 sm:col-span-2 xl:col-span-2"
                style={{
                  background:   dashboard.kpis.totalPendingToPay === 0 ? undefined : 'rgba(244,63,94,0.05)',
                  borderColor:  dashboard.kpis.totalPendingToPay === 0 ? undefined : 'rgba(244,63,94,0.18)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pending to Pay</p>
                    <p className={`text-3xl font-bold mt-2 ${
                      dashboard.kpis.totalPendingToPay === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {formatCurrency(dashboard.kpis.totalPendingToPay)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {dashboard.kpis.totalPendingToPay === 0 ? 'No outstanding payments' : 'outstanding across all employees'}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    dashboard.kpis.totalPendingToPay === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    <AlertCircle size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts + Top Employees */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Monthly Trend Chart */}
              <div className="card xl:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-semibold text-slate-200">Monthly Project Submissions</h2>
                  <ArrowUpRight size={16} className="text-slate-500" />
                </div>
                {dashboard.monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dashboard.monthlyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                        labelStyle={{ color: '#94a3b8' }}
                        itemStyle={{ color: '#60a5fa' }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-56 flex items-center justify-center text-slate-500 text-sm">
                    No data for the last 6 months
                  </div>
                )}
              </div>

              {/* Project Status Breakdown */}
              <div className="card">
                <h2 className="text-base font-semibold text-slate-200 mb-4">Projects by Status</h2>
                <div className="space-y-3">
                  {Object.entries(dashboard.projectsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <StatusBadge status={status} />
                      <span className="text-slate-300 font-semibold">{count}</span>
                    </div>
                  ))}
                  {Object.keys(dashboard.projectsByStatus).length === 0 && (
                    <p className="text-slate-500 text-sm">No projects yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <div className="card">
                <h2 className="text-base font-semibold text-slate-200 mb-4">Recent Projects</h2>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Service</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentProjects.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center text-slate-500 py-6">No projects yet</td>
                        </tr>
                      )}
                      {dashboard.recentProjects.slice(0, 6).map((p) => (
                        <tr key={p.id}>
                          <td className="font-medium text-slate-200">{p.employee?.name ?? '—'}</td>
                          <td className="text-slate-400">{p.service?.name ?? '—'}</td>
                          <td className="text-slate-300">{p.calculatedAmount ? `₹${Number(p.calculatedAmount).toLocaleString()}` : '—'}</td>
                          <td><StatusBadge status={p.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Employees */}
              <div className="card">
                <h2 className="text-base font-semibold text-slate-200 mb-4">Top Employees (by Earnings)</h2>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Projects</th>
                        <th>Total Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.topEmployees.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center text-slate-500 py-6">No data yet</td>
                        </tr>
                      )}
                      {dashboard.topEmployees.map((e, i) => (
                        <tr key={i}>
                          <td className="font-medium text-slate-200">{e.employee?.name ?? '—'}</td>
                          <td className="text-slate-400">{e.projectCount}</td>
                          <td className="text-emerald-400 font-semibold">
                            ₹{Number(e.totalEarned ?? 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
