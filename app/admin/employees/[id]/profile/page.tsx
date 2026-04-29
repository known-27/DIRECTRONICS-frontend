'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { usersApi, uploadsApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner, ErrorState } from '@/components/ui/LoadingStates';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import FileUpload from '@/components/ui/FileUpload';
import DocumentViewer from '@/components/ui/DocumentViewer';
import { Modal } from '@/components/ui/Modal';
import {
  ArrowLeft, User, Phone, MapPin, CreditCard, Briefcase,
  BarChart3, Eye, Edit2, X, Camera, AlertTriangle, Save,
} from 'lucide-react';
import Link from 'next/link';
import type { UserDetail } from '@/types';
import type { AxiosError } from 'axios';

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color = 'text-slate-200' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="card text-center">
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span style={{ color: 'var(--text-muted)', marginTop: 2 }}>{icon}</span>
      <div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EmployeeProfilePage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const qc      = useQueryClient();

  const [editMode, setEditMode]         = useState(false);
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteError, setDeleteError]   = useState<string | null>(null);
  const [saveError, setSaveError]       = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{ data: UserDetail }>({
    queryKey: ['user-profile', id],
    queryFn:  () => usersApi.getProfile(id).then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      fullName:       '',
      email:          '',
      mobileNumber1:  '',
      mobileNumber2:  '',
      address:        '',
      identityDocType: '' as '' | 'AADHAR' | 'PAN',
      staticSalary:   '',
      isActive:       true,
    },
  });

  const enterEditMode = (): void => {
    if (!user) return;
    reset({
      fullName:       user.fullName ?? '',
      email:          user.email,
      mobileNumber1:  user.mobileNumber1 ?? '',
      mobileNumber2:  user.mobileNumber2 ?? '',
      address:        user.address ?? '',
      identityDocType: (user.identityDocType ?? '') as '' | 'AADHAR' | 'PAN',
      staticSalary:   user.staticSalary != null ? String(user.staticSalary) : '',
      isActive:       user.isActive,
    });
    setSaveError(null);
    setEditMode(true);
  };

  const saveMutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => {
      const payload: Record<string, unknown> = {
        fullName:      d.fullName,
        email:         d.email,
        mobileNumber1: d.mobileNumber1,
        mobileNumber2: d.mobileNumber2 || null,
        address:       d.address || null,
        identityDocType: d.identityDocType || null,
        staticSalary:  d.staticSalary || null,
        isActive:      d.isActive,
      };
      return usersApi.update(id, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-profile', id] });
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditMode(false);
      setSaveError(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      setSaveError(err.response?.data?.message ?? 'Failed to save changes');
    },
  });

  const profilePicMutation = useMutation({
    mutationFn: (file: File) => uploadsApi.uploadProfilePicture(file, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-profile', id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      router.push('/admin/employees');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      setDeleteError(err.response?.data?.message ?? 'Failed to delete employee');
    },
  });

  if (isLoading) return <DashboardLayout><LoadingSpinner text="Loading profile..." /></DashboardLayout>;
  if (error || !data) return <DashboardLayout><ErrorState message="Failed to load employee profile" /></DashboardLayout>;

  const user = data.data;
  const nameMatches = deleteConfirmName.trim().toLowerCase() === (user.fullName || user.name).toLowerCase();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <Link href="/admin/employees" className="btn-ghost btn-sm"><ArrowLeft size={18} /></Link>
          <div className="flex-1">
            <h1 className="page-title">{user.fullName || user.name}</h1>
            <p className="page-subtitle">{editMode ? 'Editing profile' : user.email}</p>
          </div>

          {!editMode ? (
            <div className="flex items-center gap-2">
              <button onClick={enterEditMode} className="btn-secondary">
                <Edit2 size={15} /> Edit Profile
              </button>
              <button onClick={() => { setDeleteOpen(true); setDeleteError(null); setDeleteConfirmName(''); }} className="btn-danger">
                <X size={15} /> Delete
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditMode(false); setSaveError(null); }} className="btn-secondary" disabled={isSubmitting}>
                Cancel
              </button>
              <button
                onClick={handleSubmit((d) => saveMutation.mutate(d as Record<string, unknown>))}
                className="btn-primary" disabled={isSubmitting}>
                <Save size={15} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {saveError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{saveError}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ── */}
          <div className="space-y-4">

            {/* Avatar + Profile Picture */}
            <div className="card flex flex-col items-center gap-4 py-6">
              <div className="relative">
                <ProfileAvatar profilePictureUrl={user.profilePictureUrl} fullName={user.fullName ?? user.name} size="xl" />
                <button
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: 'var(--accent-primary)', color: '#fff' }}
                  title="Change profile picture"
                >
                  <Camera size={14} />
                </button>
                <input id="avatar-upload" type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await profilePicMutation.mutateAsync(file);
                    e.target.value = '';
                  }} />
              </div>

              <div className="text-center">
                <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{user.fullName || user.name}</p>
                <div className="flex gap-2 justify-center mt-1">
                  <StatusBadge status={user.role} />
                  <StatusBadge status={user.isActive ? 'active' : 'inactive'} />
                </div>
              </div>
            </div>

            {/* Personal Info — view or edit */}
            <div className="card space-y-3">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
                <User size={14} className="inline mr-2" />Personal Info
              </h3>

              {!editMode ? (
                <>
                  <InfoRow icon={<Phone size={13} />} label="Mobile 1" value={user.mobileNumber1 || '—'} />
                  {user.mobileNumber2 && <InfoRow icon={<Phone size={13} />} label="Mobile 2" value={user.mobileNumber2} />}
                  {user.address && <InfoRow icon={<MapPin size={13} />} label="Address" value={user.address} />}
                  {user.staticSalary !== null && (
                    <InfoRow icon={<CreditCard size={13} />} label="Static Salary"
                      value={`₹${Number(user.staticSalary).toLocaleString('en-IN')}`} />
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="label">Full Name *</label>
                    <input className="input" {...register('fullName', { required: true })} />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input type="email" className="input" {...register('email', { required: true })} />
                  </div>
                  <div>
                    <label className="label">Mobile 1 *</label>
                    <input className="input" {...register('mobileNumber1', { required: true })} />
                  </div>
                  <div>
                    <label className="label">Mobile 2</label>
                    <input className="input" {...register('mobileNumber2')} />
                  </div>
                  <div>
                    <label className="label">Address</label>
                    <textarea className="textarea" rows={2} {...register('address')} />
                  </div>
                  <div>
                    <label className="label">Identity Doc Type</label>
                    <select className="select" {...register('identityDocType')}>
                      <option value="">None</option>
                      <option value="AADHAR">Aadhar</option>
                      <option value="PAN">PAN</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Static Salary (₹)</label>
                    <input type="number" min="0" step="0.01" className="input" placeholder="0.00" {...register('staticSalary')} />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="label mb-0">Active</label>
                    <input type="checkbox" {...register('isActive')} className="rounded border-slate-700" />
                  </div>
                  <div className="p-3 rounded-lg text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                    🔒 Password and role can only be changed through dedicated admin tools.
                  </div>
                </div>
              )}
            </div>

            {/* Identity Document */}
            {!editMode && (
              <div className="card space-y-2">
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <CreditCard size={14} className="inline mr-2" />Identity Document
                </h3>
                {user.identityDocType && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Type: {user.identityDocType}</p>
                )}
                {user.identityDocUrl ? (
                  <button onClick={() => setDocViewerOpen(true)} className="btn-secondary btn-sm w-full">
                    <Eye size={13} /> View Document
                  </button>
                ) : (
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>No document uploaded yet</p>
                )}
                <FileUpload
                  label={user.identityDocUrl ? 'Replace Document' : 'Upload Identity Doc'}
                  accept=".jpg,.jpeg,.png,.pdf" maxSizeMB={5} previewType="document"
                  onUpload={async (file) => {
                    const res = await uploadsApi.uploadIdentityDoc(file, id);
                    qc.invalidateQueries({ queryKey: ['user-profile', id] });
                    return (res.data as { data: { identityDocUrl: string } }).data.identityDocUrl;
                  }} />
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total Projects" value={user._count.projects} />
              <StatCard label="Total Earned" value={`₹${Number(user.totalEarned).toLocaleString('en-IN')}`} color="text-emerald-400" />
              <StatCard label="Pending" value={`₹${Number(user.pendingAmount ?? 0).toLocaleString('en-IN')}`} color="text-amber-400" />
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={16} style={{ color: 'var(--accent-primary)' }} />
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>Assigned Services</h3>
              </div>
              {user.employeeServiceMapping.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No services assigned.</p>
              ) : (
                <div className="space-y-2">
                  {user.employeeServiceMapping.map((m) => (
                    <div key={m.id} className="card-sm flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.service?.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {m.formula ? `Formula: ${m.formula.name}` : 'No formula'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {user.projects && user.projects.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={16} style={{ color: 'var(--accent-primary)' }} />
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>Recent Projects</h3>
                </div>
                <div className="table-wrapper">
                  <table className="table">
                    <thead><tr><th>Invoice</th><th>Project</th><th>Service</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {user.projects.map((p) => (
                        <tr key={p.id}>
                          <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{p.invoiceNumber ?? '—'}</td>
                          <td style={{ color: 'var(--text-primary)' }}>{p.projectName}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{p.service?.name}</td>
                          <td>
                            {p.calculatedAmount != null
                              ? <span className="text-emerald-400">₹{Number(p.calculatedAmount).toLocaleString('en-IN')}</span>
                              : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td><StatusBadge status={p.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Document Viewer ── */}
      {user.identityDocUrl && (
        <DocumentViewer
          apiPath={user.identityDocUrl}
          label={`${user.name} — ${user.identityDocType ?? 'Identity'} Document`}
          isOpen={docViewerOpen}
          onClose={() => setDocViewerOpen(false)} />
      )}

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteError(null); setDeleteConfirmName(''); }}
        title="Delete Employee Profile"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteOpen(false)}>Cancel</button>
            <button
              className="btn-danger"
              disabled={!nameMatches || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Employee'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">This action is irreversible</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                The employee account will be permanently deactivated. All historical project and payment records will be preserved.
                The employee will be immediately signed out and cannot log in again.
              </p>
            </div>
          </div>

          <div>
            <label className="label">
              Type <strong style={{ color: 'var(--text-primary)' }}>{user.fullName || user.name}</strong> to confirm
            </label>
            <input
              className="input"
              placeholder="Type employee's full name exactly"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)} />
          </div>

          {deleteError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
              {deleteError}
            </div>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
