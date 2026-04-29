'use client';

/**
 * Employee self-profile / account settings page.
 * Route: /employee/profile
 *
 * Allows the logged-in employee to:
 *  - View their profile picture (xl ProfileAvatar)
 *  - Upload a new profile picture → updates AuthContext immediately (no reload)
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadsApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import FileUpload from '@/components/ui/FileUpload';
import { User, Mail } from 'lucide-react';

export default function EmployeeProfilePage(): React.ReactElement {
  const { user, updateCurrentUser } = useAuth();

  const handleProfilePicUpload = async (file: File): Promise<string> => {
    const res = await uploadsApi.uploadProfilePicture(file);
    const newUrl = (res.data as { data: { profilePictureUrl: string } }).data.profilePictureUrl;
    // Instantly update sidebar + dashboards without a page reload
    updateCurrentUser({ profilePictureUrl: newUrl });
    return newUrl;
  };

  if (!user) return <DashboardLayout><div /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account and profile picture</p>
        </div>

        {/* Avatar card */}
        <div className="card flex flex-col items-center gap-4 py-8">
          <ProfileAvatar
            profilePictureUrl={user.profilePictureUrl}
            fullName={user.fullName ?? user.name}
            size="xl"
          />

          <div className="text-center">
            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              {user.fullName ?? user.name}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
            <span className="badge badge-green mt-2 inline-block">{user.role}</span>
          </div>

          {/* Upload */}
          <div className="w-full max-w-xs">
            <FileUpload
              label="Change Profile Picture"
              accept=".jpg,.jpeg,.png,.webp"
              maxSizeMB={2}
              previewType="image"
              onUpload={handleProfilePicUpload}
            />
          </div>
        </div>

        {/* Contact info */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Account Details
          </h3>

          {[
            { icon: <User size={14} />, label: 'Name', value: user.name },
            { icon: <Mail size={14} />, label: 'Email', value: user.email },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <span style={{ color: 'var(--text-faint)' }}>{icon}</span>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
