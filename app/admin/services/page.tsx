'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { servicesApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui/LoadingStates';
import { Plus, Edit2, Settings, PlusCircle, X, Tag } from 'lucide-react';
import type { Service } from '@/types';
import type { AxiosError } from 'axios';

export default function ServicesPage(): React.ReactElement {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{ data: Service[] }>({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(true).then((r) => r.data),
  });

  const { register, control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: '', description: '', invoicePrefix: '', fields: [{ key: '', label: '', type: 'text', required: false }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'fields' });

  const createMutation = useMutation({
    mutationFn: (d: unknown) => editService ? servicesApi.update(editService.id, d) : servicesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); closeModal(); },
    onError: (err: AxiosError<{ message: string }>) => setApiError(err.response?.data?.message ?? 'Failed to save service'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => servicesApi.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  const openCreate = (): void => {
    setEditService(null);
    reset({ name: '', description: '', invoicePrefix: '', fields: [{ key: '', label: '', type: 'text', required: false }] });
    setApiError(null);
    setModalOpen(true);
  };

  const openEdit = (s: Service): void => {
    setEditService(s);
    reset({ name: s.name, description: s.description ?? '', invoicePrefix: s.invoicePrefix ?? '', fields: s.fields as never[] });
    setApiError(null);
    setModalOpen(true);
  };

  const closeModal = (): void => { setModalOpen(false); setEditService(null); setApiError(null); };
  const onSubmit = (d: unknown): void => { createMutation.mutate(d); };

  const prefixValue = watch('invoicePrefix');
  const services = data?.data ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Service Management</h1>
            <p className="page-subtitle">Manage service definitions and dynamic field schemas</p>
          </div>
          <button onClick={openCreate} className="btn-primary"><Plus size={18} /> New Service</button>
        </div>

        {isLoading && <LoadingSpinner text="Loading services..." />}
        {error && <ErrorState message="Failed to load services" />}

        {!isLoading && services.length === 0 && (
          <EmptyState title="No services yet" description="Create your first service with dynamic field definitions"
            action={<button onClick={openCreate} className="btn-primary">Create Service</button>}
            icon={<Settings size={40} />} />
        )}

        {services.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Service Name</th><th>Description</th><th>Prefix</th><th>Fields</th>
                  <th>Employees</th><th>Projects</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className="font-semibold text-slate-200">{s.name}</td>
                    <td className="text-slate-400 max-w-xs truncate">{s.description ?? '—'}</td>
                    <td>
                      {s.invoicePrefix
                        ? <span className="badge badge-blue font-mono text-xs">{s.invoicePrefix}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td><span className="badge-blue badge">{(s.fields as unknown[]).length} fields</span></td>
                    <td className="text-slate-400">{s._count?.employeeServiceMapping ?? 0}</td>
                    <td className="text-slate-400">{s._count?.projects ?? 0}</td>
                    <td><StatusBadge status={s.isActive ? 'active' : 'inactive'} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(s)} className="btn-ghost btn-sm"><Edit2 size={14} /></button>
                        <button onClick={() => toggleMutation.mutate({ id: s.id, isActive: !s.isActive })}
                          className={s.isActive ? 'btn-danger btn-sm' : 'btn-success btn-sm'}>
                          {s.isActive ? 'Deactivate' : 'Activate'}
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

      <Modal isOpen={modalOpen} onClose={closeModal} title={editService ? 'Edit Service' : 'Create Service'} size="lg"
        footer={<><button className="btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : editService ? 'Save Changes' : 'Create Service'}
          </button></>}>
        {apiError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">{apiError}</div>}
        <div className="space-y-4">
          <div>
            <label className="label">Service Name *</label>
            <input className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Electronics Repair" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="error-msg">{errors.name.message as string}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="textarea" rows={2} placeholder="Brief description..." {...register('description')} />
          </div>

          {/* Invoice Prefix */}
          <div>
            <label className="label flex items-center gap-1.5"><Tag size={13} style={{ color: 'var(--text-muted)' }} /> Invoice Number Prefix</label>
            <div className="relative">
              <input className="input uppercase" placeholder="e.g. ELEC" maxLength={10}
                {...register('invoicePrefix')}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, '');
                  register('invoicePrefix').onChange(e);
                }} />
              {prefixValue && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono px-2 py-0.5 rounded"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--accent-primary)' }}>
                  {prefixValue}
                </span>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Optional. Shown as a hint to employees — e.g.&nbsp;
              <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{prefixValue || 'SRV'}-00123</span>
            </p>
          </div>

          {/* Dynamic Fields */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Dynamic Fields *</label>
              <button type="button" onClick={() => append({ key: '', label: '', type: 'text', required: false })} className="btn-ghost btn-sm text-blue-400">
                <PlusCircle size={14} /> Add Field
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="card-sm flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Field Key</label>
                      <input className="input text-xs py-1.5" placeholder="repairHours" {...register(`fields.${idx}.key`, { required: true })} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Label</label>
                      <input className="input text-xs py-1.5" placeholder="Repair Hours" {...register(`fields.${idx}.label`, { required: true })} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Type</label>
                      <select className="select text-xs py-1.5" {...register(`fields.${idx}.type`)}>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="textarea">Textarea</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-slate-700" {...register(`fields.${idx}.required`)} />
                        <span className="text-xs text-slate-400">Required</span>
                      </label>
                    </div>
                  </div>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(idx)} className="text-slate-600 hover:text-red-400 mt-6"><X size={16} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
