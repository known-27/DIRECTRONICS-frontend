'use client';

import React, { useState } from 'react';
import { Sidebar, MobileMenuButton } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { NotificationsProvider } from '@/contexts/NotificationsContext';

function AdminDashboardLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pendingReviewCount, refetch } = useNotificationCounts();

  return (
    <NotificationsProvider pendingReviewCount={pendingReviewCount} refetch={refetch}>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
        <MobileMenuButton onClick={() => setSidebarOpen(true)} />
        <main className="lg:ml-64 min-h-screen">
          <div className="p-6 lg:p-8 animate-fade-in">{children}</div>
        </main>
      </div>
    </NotificationsProvider>
  );
}

function EmployeeDashboardLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      <MobileMenuButton onClick={() => setSidebarOpen(true)} />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}

export const DashboardLayout = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') {
    return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
  }

  return <EmployeeDashboardLayout>{children}</EmployeeDashboardLayout>;
};
