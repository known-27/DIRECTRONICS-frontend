'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner, ErrorState } from '@/components/ui/LoadingStates';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { FolderKanban, CheckCircle, Wallet, Plus, ArrowDownCircle } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatCurrency';
import type { EmployeeDashboard } from '@/types';

const KPICard = ({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string;
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

export default function EmployeeDashboard(): React.ReactElement {
  const { data, isLoading, error, refetch } = useQuery<{ data: EmployeeDashboard }>({
    queryKey: ['employee-dashboard'],
    queryFn: () => dashboardApi.employee().then((r) => r.data),
  });

  const dashboard = data?.data;
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ProfileAvatar
              profilePictureUrl={user?.profilePictureUrl}
              fullName={user?.fullName ?? user?.name ?? 'Employee'}
              size="lg"
            />
            <div>
              <h1 className="page-title">Welcome, {user?.name?.split(' ')[0] ?? 'Employee'}</h1>
              <p className="page-subtitle">Your project activity and earnings</p>
            </div>
          </div>
          <Link href="/employee/create-project" className="btn-primary">
            <Plus size={18} />
            New Project
          </Link>
        </div>

        {isLoading && <LoadingSpinner text="Loading dashboard..." />}
        {error && <ErrorState message="Failed to load dashboard" onRetry={refetch} />}

        {dashboard && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <KPICard title="Total Projects"   value={dashboard.kpis.totalProjects}                icon={FolderKanban}    color="bg-blue-500/10 text-blue-400"   />
              <KPICard title="Approved Projects" value={dashboard.kpis.approvedProjects}             icon={CheckCircle}     color="bg-emerald-500/10 text-emerald-400" />
              <KPICard title="Total Calculated"  value={formatCurrency(dashboard.kpis.totalEarned)}  icon={Wallet}          color="bg-purple-500/10 text-purple-400" />
              <KPICard title="Received"           value={formatCurrency(dashboard.kpis.totalReceived)} icon={ArrowDownCircle} color="bg-emerald-500/10 text-emerald-400" />
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
                    <p className="text-slate-500 text-sm">Create your first project to see data here.</p>
                  )}
                </div>
              </div>

              {/* Recent Projects */}
              <div className="card xl:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-200">Recent Projects</h2>
                  <Link href="/employee/projects" className="text-xs text-blue-400 hover:text-blue-300">View All →</Link>
                </div>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentProjects.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center text-slate-500 py-6">No projects yet. <Link href="/employee/create-project" className="text-blue-400 hover:underline">Create one</Link></td>
                        </tr>
                      )}
                      {dashboard.recentProjects.slice(0, 8).map((p) => (
                        <tr key={p.id}>
                          <td className="font-medium text-slate-200">{p.service?.name ?? '—'}</td>
                          <td className="text-slate-300">{p.calculatedAmount ? formatCurrency(p.calculatedAmount) : '—'}</td>
                          <td><StatusBadge status={p.status} /></td>
                          <td className="text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
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
