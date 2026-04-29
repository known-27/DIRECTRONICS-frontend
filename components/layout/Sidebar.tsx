'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import {
  LayoutDashboard, Users, Wrench, FolderKanban,
  CreditCard, FlaskConical, LogOut, Zap, Menu, X,
  Sun, Moon, User, type LucideIcon,
} from 'lucide-react';

interface NavLink {
  href:   string;
  label:  string;
  icon:   LucideIcon;
  badge?: boolean;
}

const adminLinks: NavLink[] = [
  { href: '/admin/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/employees',  label: 'Employees', icon: Users },
  { href: '/admin/services',   label: 'Services',  icon: Wrench },
  { href: '/admin/projects',   label: 'Projects',  icon: FolderKanban, badge: true },
  { href: '/admin/payments',   label: 'Payments',  icon: CreditCard },
  { href: '/admin/formulas',   label: 'Formulas',  icon: FlaskConical },
  { href: '/admin/profile',    label: 'Profile',   icon: User },
];

const employeeLinks: NavLink[] = [
  { href: '/employee/dashboard',       label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/employee/projects',        label: 'My Projects', icon: FolderKanban },
  { href: '/employee/create-project',  label: 'New Project', icon: Zap },
  { href: '/employee/profile',         label: 'Profile',     icon: User },
];

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const NotificationBadge = ({ count }: { count: number }): React.ReactElement | null => {
  if (count <= 0) return null;
  const label = count > 99 ? '99+' : String(count);
  return (
    <span
      style={{
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        backgroundColor: '#EF4444',
        color: '#fff',
        fontSize: '10px',
        fontWeight: 700,
        lineHeight: 1,
        minWidth: '18px',
        height: '18px',
        borderRadius: count > 9 ? '9999px' : '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4px',
        pointerEvents: 'none',
      }}
      aria-label={`${count} pending review`}
    >
      {label}
    </span>
  );
};

export const Sidebar = ({ isOpen = true, onToggle }: SidebarProps): React.ReactElement => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pendingReviewCount } = useNotifications();
  const links = user?.role === 'ADMIN' ? adminLinks : employeeLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onToggle && (
        <div
          className="fixed inset-0 z-30 backdrop-blur-sm lg:hidden"
          style={{ background: 'var(--modal-overlay)' }}
          onClick={onToggle}
        />
      )}

      <aside
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-base)',
        }}
        className={`fixed top-0 left-0 z-40 h-full w-64
                    flex flex-col transition-transform duration-300 lg:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: '1px solid var(--border-base)' }}
        >
          <div className="flex-shrink-0" style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpeg"
              alt="DIRECTRONICS Logo"
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>DIRECTRONICS</span>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>ServiceFlow ERP</p>
          </div>
          {onToggle && (
            <button
              onClick={onToggle}
              className="lg:hidden"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* User info */}
        <div
          className="px-4 py-4"
          style={{ borderBottom: '1px solid var(--border-base)' }}
        >
          <div className="flex items-center gap-3">
            <ProfileAvatar
              profilePictureUrl={user?.profilePictureUrl}
              fullName={user?.fullName ?? user?.name ?? 'User'}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{user?.email}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className={`badge text-xs ${user?.role === 'ADMIN' ? 'badge-blue' : 'badge-green'}`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${pathname.startsWith(href) ? 'active' : ''}`}
              style={{ position: 'relative' }}
            >
              <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                <Icon size={18} />
                {badge && user?.role === 'ADMIN' && (
                  <NotificationBadge count={pendingReviewCount} />
                )}
              </span>
              {label}
            </Link>
          ))}
        </nav>

        {/* Bottom: theme toggle + logout */}
        <div
          className="p-3 space-y-1"
          style={{ borderTop: '1px solid var(--border-base)' }}
        >
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="sidebar-link w-full"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={18} className="text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={18} className="text-blue-400" />
                <span>Dark Mode</span>
              </>
            )}
            {/* Animated toggle pill */}
            <span
              className="ml-auto relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 flex-shrink-0"
              style={{
                backgroundColor: theme === 'dark' ? 'rgb(37 99 235)' : 'rgb(148 163 184)',
              }}
            >
              <span
                className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-300"
                style={{
                  transform: theme === 'dark' ? 'translateX(18px)' : 'translateX(3px)',
                }}
              />
            </span>
          </button>

          {/* Sign out */}
          <button
            onClick={logout}
            className="sidebar-link w-full"
            style={{ color: 'rgb(239 68 68)' }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export const MobileMenuButton = ({ onClick }: { onClick: () => void }): React.ReactElement => (
  <button
    onClick={onClick}
    className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
    style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-base)',
      color: 'var(--text-muted)',
    }}
  >
    <Menu size={20} />
  </button>
);
