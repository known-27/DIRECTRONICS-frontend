'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { formulasApi, servicesApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui/LoadingStates';
import { Plus, FlaskConical, PlusCircle, X, Play } from 'lucide-react';
import type { Formula, Service } from '@/types';
import type { AxiosError } from 'axios';

export default function FormulasPage(): React.ReactElement {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editFormula, setEditFormula] = useState<Formula | null>(null);
  const [testFormula, setTestFormula] = useState<Formula | null>(null);
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{ result: number; breakdown: Record<string, number> } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{ data: Formula[] }>({
    queryKey: ['formulas', selectedServiceId],
    queryFn: () => formulasApi.list(selectedServiceId || undefined).then((r) => r.data),
  });

  const { data: servicesData } = useQuery<{ data: Service[] }>({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(false).then((r) => r.data),
  });

  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { name: '', serviceId: '', expression: '', variables: [{ key: '', label: '', type: 'number', sourceField: '' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'variables' });

  const saveMutation = useMutation({
    mutationFn: (d: unknown) => editFormula ? formulasApi.update(editFormula.id, d) : formulasApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formulas'] }); closeModal(); },
    onError: (err: AxiosError<{ message: string }>) => setApiError(err.response?.data?.message ?? 'Failed to save formula'),
  });

  const closeModal = (): void => { setModalOpen(false); setEditFormula(null); setApiError(null); };

  const openCreate = (): void => {
    setEditFormula(null);
    reset({ name: '', serviceId: '', expression: '', variables: [{ key: '', label: '', type: 'number', sourceField: '' }] });
    setApiError(null);
    setModalOpen(true);
  };

  const openEdit = (f: Formula): void => {
    setEditFormula(f);
    reset({ name: f.name, serviceId: f.serviceId, expression: f.expression, variables: f.variables as never[] });
    setApiError(null);
    setModalOpen(true);
  };

  const openTest = (f: Formula): void => {
    setTestFormula(f);
    const initial: Record<string, string> = {};
    (f.variables as Array<{ key: string }>).forEach(v => { initial[v.key] = ''; });
    setTestValues(initial);
    setTestResult(null);
    setTestError(null);
  };

  const runTest = async (): Promise<void> => {
    if (!testFormula) return;
    setTestLoading(true);
    setTestResult(null);
    setTestError(null);
    try {
      const res = await formulasApi.test(testFormula.id, testValues);
      setTestResult(res.data.data);
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      setTestError(e.response?.data?.message ?? 'Test failed');
    } finally {
      setTestLoading(false);
    }
  };

  const formulas = data?.data ?? [];
  const services = servicesData?.data ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Formula Management</h1>
            <p className="page-subtitle">Define and test earnings calculation formulas</p>
          </div>
          <button onClick={openCreate} className="btn-primary"><Plus size={18} /> New Formula</button>
        </div>

        {/* Service Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Filter by service:</label>
          <select className="select w-64" value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)}>
            <option value="">All Services</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {isLoading && <LoadingSpinner text="Loading formulas..." />}
        {error && <ErrorState message="Failed to load formulas" />}

        {!isLoading && formulas.length === 0 && (
          <EmptyState title="No formulas yet" description="Create formulas to calculate employee earnings"
            action={<button onClick={openCreate} className="btn-primary">Create Formula</button>}
            icon={<FlaskConical size={40} />} />
        )}

        {formulas.length > 0 && (
          <div className="space-y-4">
            {formulas.map((f) => (
              <div key={f.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-slate-200">{f.name}</h3>
                      <span className="badge-gray badge">v{f.version}</span>
                      <StatusBadge status={f.isActive ? 'active' : 'inactive'} />
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{f.service?.name}</p>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 font-mono text-sm text-blue-300">
                      {f.expression}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(f.variables as Array<{ key: string; label: string }>).map(v => (
                        <span key={v.key} className="badge badge-gray">
                          <code className="text-xs">{v.key}</code>
                          <span className="ml-1 text-slate-500">{v.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openTest(f)} className="btn-ghost btn-sm text-emerald-400"><Play size={14} /> Test</button>
                    <button onClick={() => openEdit(f)} className="btn-secondary btn-sm">Edit</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editFormula ? 'Edit Formula (creates new version)' : 'Create Formula'} size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit(d => saveMutation.mutate(d))} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editFormula ? 'Save (New Version)' : 'Create Formula'}
            </button>
          </>
        }
      >
        {apiError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">{apiError}</div>}
        <div className="space-y-4">
          <div><label className="label">Name *</label>
            <input className="input" placeholder="Repair Labor Formula" {...register('name', { required: true })} /></div>
          <div><label className="label">Service *</label>
            <select className="select" {...register('serviceId', { required: true })}>
              <option value="">Select a service...</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="label">Expression *</label>
            <input className="input font-mono" placeholder="(hoursWorked * hourlyRate) + bonus" {...register('expression', { required: true })} />
            <p className="text-xs text-slate-500 mt-1">Use variable keys from below. Supports +, -, *, /, (), math functions.</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Variables *</label>
              <button type="button" onClick={() => append({ key: '', label: '', type: 'number', sourceField: '' })} className="btn-ghost btn-sm text-blue-400"><PlusCircle size={14} /> Add</button>
            </div>
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="card-sm flex gap-3 items-center">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input className="input text-xs py-1.5" placeholder="key (e.g. hoursWorked)" {...register(`variables.${idx}.key`, { required: true })} />
                    <input className="input text-xs py-1.5" placeholder="Label" {...register(`variables.${idx}.label`, { required: true })} />
                    <input className="input text-xs py-1.5" placeholder="sourceField (service field key)" {...register(`variables.${idx}.sourceField`)} />
                  </div>
                  {fields.length > 1 && <button type="button" onClick={() => remove(idx)} className="text-slate-600 hover:text-red-400"><X size={14} /></button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Test Panel Modal */}
      <Modal isOpen={!!testFormula} onClose={() => setTestFormula(null)} title={`Test: ${testFormula?.name}`} size="md">
        {testFormula && (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 font-mono text-sm text-blue-300">
              {testFormula.expression}
            </div>
            <div className="space-y-3">
              {(testFormula.variables as Array<{ key: string; label: string }>).map(v => (
                <div key={v.key}>
                  <label className="label">{v.label} <span className="text-slate-600">({v.key})</span></label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Enter test value"
                    value={testValues[v.key] ?? ''}
                    onChange={e => setTestValues(prev => ({ ...prev, [v.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <button onClick={runTest} disabled={testLoading} className="btn-primary w-full">
              {testLoading ? 'Calculating...' : <><Play size={16} /> Run Test</>}
            </button>
            {testError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{testError}</div>}
            {testResult && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-emerald-400 font-semibold">Result</p>
                  <p className="text-2xl font-bold text-emerald-300">₹{testResult.result.toLocaleString()}</p>
                </div>
                <div className="divider" />
                <p className="text-xs text-slate-500 mb-2">Variable Breakdown:</p>
                {Object.entries(testResult.breakdown).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-slate-400 font-mono">{k}</span>
                    <span className="text-slate-300">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
