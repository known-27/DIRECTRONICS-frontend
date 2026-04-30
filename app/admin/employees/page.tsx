'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { usersApi, servicesApi, formulasApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui/LoadingStates';

import { Plus, Users, X, User, Wrench } from 'lucide-react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import Link from 'next/link';
import type { User, Service, Formula, UserDetail } from '@/types';
import type { AxiosError } from 'axios';
import { ProtectedImage } from '@/components/ui/ProtectedImage';

export default function EmployeesPage(): React.ReactElement {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen]     = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen]     = useState(false);
  const [apiError, setApiError]         = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState('');

  const { data: usersData, isLoading, error } = useQuery<{ data: User[] }>({
    queryKey: ['users'],
    queryFn:  () => usersApi.list().then((r) => r.data),
  });

  const { data: userDetailData } = useQuery<{ data: UserDetail }>({
    queryKey: ['user', detailUserId],
    queryFn:  () => usersApi.getById(detailUserId!).then((r) => r.data),
    enabled:  !!detailUserId,
  });

  const { data: servicesData } = useQuery<{ data: Service[] }>({
    queryKey: ['services'],
    queryFn:  () => servicesApi.list(true).then((r) => r.data),
    enabled:  assignOpen,
  });

  const { data: formulasData } = useQuery<{ data: Formula[] }>({
    queryKey: ['formulas'],
    queryFn:  () => formulasApi.list().then((r) => r.data),
    enabled:  assignOpen,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: '', fullName: '', email: '', password: '',
      role: 'EMPLOYEE' as const,
      mobileNumber1: '', mobileNumber2: '', address: '',
      identityDocType: '' as '' | 'AADHAR' | 'PAN',
      staticSalary: '',
    },
  });

  const { register: regAssign, handleSubmit: handleAssign } = useForm({
    defaultValues: { serviceId: '', formulaId: '' },
  });

  // Store uploaded identity doc URL during creation
  // NOTE: identity doc cannot be uploaded during user creation because the user ID is not yet known.
  // Admin must upload documents from the employee's profile page after the account is created.

  const createMutation = useMutation({
    mutationFn: (d: unknown) => usersApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setCreateOpen(false);
      reset();
      setApiError(null);
      setPasswordValue('');
    },
    onError: (err: AxiosError<{ message: string }>) =>
      setApiError(err.response?.data?.message ?? 'Failed to create user'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const assignMutation = useMutation({
    mutationFn: (d: { userId: string; serviceId: string; formulaId?: string }) =>
      servicesApi.createMapping(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', detailUserId] });
      setAssignOpen(false);
    },
    onError: (err: AxiosError<{ message: string }>) =>
      alert(err.response?.data?.message ?? 'Failed to assign'),
  });

  const removeMappingMutation = useMutation({
    mutationFn: (mappingId: string) => servicesApi.deleteMapping(mappingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user', detailUserId] }),
  });

  const users      = usersData?.data ?? [];
  const userDetail = userDetailData?.data;

  const handleCreateSubmit = (d: Record<string, unknown>) => {
    const payload = {
      ...d,
      identityDocType: d.identityDocType || undefined,
      staticSalary:    d.staticSalary || undefined,
      mobileNumber2:   d.mobileNumber2 || undefined,
      address:         d.address || undefined,
      // identityDocUrl is NOT set here — must be uploaded from the profile page after creation
    };
    createMutation.mutate(payload);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Employee Management</h1>
            <p className="page-subtitle">Manage team members, roles, and service assignments</p>
          </div>
          <button onClick={() => { setCreateOpen(true); setApiError(null); }} className="btn-primary">
            <Plus size={18} /> Add Employee
          </button>
        </div>

        {isLoading && <LoadingSpinner text="Loading employees..." />}
        {error && <ErrorState message="Failed to load employees" />}

        {!isLoading && users.length === 0 && (
          <EmptyState title="No employees yet" icon={<Users size={40} />}
            action={<button onClick={() => setCreateOpen(true)} className="btn-primary">Add Employee</button>} />
        )}

        {users.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th><th>Mobile</th><th>Email</th><th>Role</th><th>Status</th><th>Projects</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <ProtectedImage
                          src={u.profilePictureUrl}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover"
                          fallback={
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ background: `var(--accent-primary)` }}>
                              {(u.fullName || u.name).charAt(0).toUpperCase()}
                            </div>
                          }
                        />
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.fullName || u.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.name}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.mobileNumber1 || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td><StatusBadge status={u.role} /></td>
                    <td><StatusBadge status={u.isActive ? 'active' : 'inactive'} /></td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {(u as User & { _count?: { projects: number } })._count?.projects ?? 0}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setDetailUserId(u.id)} className="btn-secondary btn-sm flex items-center gap-1.5">
                          <Wrench size={14} /> Services
                        </button>
                        <Link href={`/admin/employees/${u.id}/profile`} className="btn-secondary btn-sm flex items-center gap-1.5">
                          <User size={14} /> Profile
                        </Link>
                        <button
                          onClick={() => toggleMutation.mutate({ id: u.id, isActive: !u.isActive })}
                          className={u.isActive ? 'btn-danger btn-sm' : 'btn-success btn-sm'}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* â”€â”€ Create Employee Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Modal isOpen={createOpen} onClose={() => { setCreateOpen(false); setApiError(null); reset(); }} title="Add Employee"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="btn-primary"
              onClick={handleSubmit(handleCreateSubmit as Parameters<typeof handleSubmit>[0])}
              disabled={isSubmitting || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Employee'}
            </button>
          </>
        }
      >
        {apiError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">{apiError}</div>}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Username *</label>
              <input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="username"
                {...register('name', { required: true })} /></div>
            <div><label className="label">Full Name *</label>
              <input className={`input ${errors.fullName ? 'input-error' : ''}`} placeholder="Full legal name"
                {...register('fullName', { required: true })} /></div>
          </div>
          <div><label className="label">Email *</label>
            <input type="email" className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="employee@company.com" {...register('email', { required: true })} /></div>
          <div><label className="label">Password *</label>
            <PasswordInput
              id="create-employee-password"
              value={passwordValue}
              showStrength
              onChange={(e) => {
                setPasswordValue(e.target.value);
                setValue('password', e.target.value, { shouldValidate: true });
              }}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <p className="error-msg">{String(errors.password.message)}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Mobile 1 *</label>
              <input className={`input ${errors.mobileNumber1 ? 'input-error' : ''}`} placeholder="10-digit mobile"
                {...register('mobileNumber1', { required: true })} /></div>
            <div><label className="label">Mobile 2</label>
              <input className="input" placeholder="Optional" {...register('mobileNumber2')} /></div>
          </div>
          <div><label className="label">Address</label>
            <textarea className="textarea" rows={2} placeholder="Address (optional)"
              {...register('address')} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Identity Doc Type</label>
              <select className="select" {...register('identityDocType')}>
                <option value="">None</option>
                <option value="AADHAR">Aadhar</option>
                <option value="PAN">PAN</option>
              </select></div>
            <div><label className="label">Static Salary (₹)</label>
              <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
                {...register('staticSalary')} /></div>
          </div>
          <div><label className="label">Role</label>
            <select className="select" {...register('role')}>
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select></div>

          {/* Identity document upload note */}
          <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>ðŸ“Ž</span>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              You can upload the employee&apos;s identity document (Aadhar/PAN) from their{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>Profile Page</strong>{' '}
              after creating the account.
            </p>
          </div>
        </div>
      </Modal>

      {/* â”€â”€ Employee Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Modal isOpen={!!detailUserId} onClose={() => setDetailUserId(null)} title="Employee Details" size="lg">
        {userDetail && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ background: 'var(--accent-primary)' }}>
                {(userDetail.fullName || userDetail.name).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{userDetail.fullName || userDetail.name}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{userDetail.email}</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{userDetail.mobileNumber1}</p>
                <div className="flex gap-2 mt-1">
                  <StatusBadge status={userDetail.role} />
                  <StatusBadge status={userDetail.isActive ? 'active' : 'inactive'} />
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Earned</p>
                <p className="text-xl font-bold text-emerald-400">₹{Number(userDetail.totalEarned).toLocaleString()}</p>
                <Link href={`/admin/employees/${userDetail.id}/profile`} className="text-xs underline mt-1 block"
                  style={{ color: 'var(--accent-primary)' }}>
                  Full Profile â†’
                </Link>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--border-subtle)' }} />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Assigned Services</h3>
                <button onClick={() => setAssignOpen(true)} className="btn-primary btn-sm"><Plus size={14} /> Assign</button>
              </div>
              {userDetail.employeeServiceMapping.length === 0 && (
                <p style={{ color: 'var(--text-muted)' }} className="text-sm">No services assigned yet.</p>
              )}
              <div className="space-y-2">
                {userDetail.employeeServiceMapping.map((m) => (
                  <div key={m.id} className="card-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.service?.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {m.formula ? `Formula: ${m.formula.name}` : 'No formula assigned'}
                      </p>
                    </div>
                    <button onClick={() => removeMappingMutation.mutate(m.id)} className="btn-danger btn-sm">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* â”€â”€ Assign Service Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Service"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAssignOpen(false)}>Cancel</button>
            <button className="btn-primary"
              onClick={handleAssign((d) => assignMutation.mutate({ userId: detailUserId!, serviceId: d.serviceId, formulaId: d.formulaId || undefined }))}>
              Assign
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div><label className="label">Service *</label>
            <select className="select" {...regAssign('serviceId', { required: true })}>
              <option value="">Select a service...</option>
              {servicesData?.data.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          <div><label className="label">Formula (optional)</label>
            <select className="select" {...regAssign('formulaId')}>
              <option value="">No formula</option>
              {formulasData?.data.filter(f => f.isActive).map(f => <option key={f.id} value={f.id}>{f.name} (v{f.version})</option>)}
            </select></div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
