'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { servicesApi, projectsApi } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingSpinner, ErrorState } from '@/components/ui/LoadingStates';
import { CheckCircle, ChevronRight, ChevronLeft, Info, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Service, ServiceField } from '@/types';
import type { AxiosError } from 'axios';

type Step = 1 | 2 | 3;
type InvoiceStatus = 'idle' | 'checking' | 'available' | 'taken';

export default function CreateProjectPage(): React.ReactElement {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [projectName, setProjectName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>('idle');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced invoice check
  const checkInvoice = useCallback(async (value: string) => {
    if (!value.trim()) { setInvoiceStatus('idle'); return; }
    setInvoiceStatus('checking');
    try {
      const res = await projectsApi.checkInvoice(value.trim());
      setInvoiceStatus(res.data.data.available ? 'available' : 'taken');
    } catch {
      setInvoiceStatus('idle');
    }
  }, []);

  const { data: servicesData, isLoading: servicesLoading, error: servicesError } = useQuery<{ data: Service[] }>({
    queryKey: ['my-services'],
    queryFn: () => servicesApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: unknown) => projectsApi.create(data),
    onSuccess: (res) => { setDraftId(res.data.data.id); setStep(3); setError(null); },
    onError: (err: AxiosError<{ message: string }>) => {
      setError(err.response?.data?.message ?? 'Failed to create project');
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => projectsApi.submit(id),
    onSuccess: (res) => { router.push(`/employee/projects/${res.data.data.id}`); },
    onError: (err: AxiosError<{ message: string }>) => {
      setError(err.response?.data?.message ?? 'Failed to submit project');
    },
  });

  const services = servicesData?.data ?? [];

  const handleStep1Next = (): void => {
    if (!selectedService || !projectName.trim() || !startDate) {
      setError('Please select a service, enter a project name, and choose a start date');
      return;
    }
    if (!invoiceNumber.trim()) {
      setError('Please enter an invoice number');
      return;
    }
    if (invoiceStatus === 'taken') {
      setError('This invoice number is already in use. Please choose a different one.');
      return;
    }
    const initial: Record<string, string> = {};
    (selectedService.fields as ServiceField[]).forEach(f => { initial[f.key] = ''; });
    setFieldValues(initial);
    setStep(2);
    setError(null);
  };

  const handleStep2Next = (): void => {
    if (!selectedService) return;
    const missing = (selectedService.fields as ServiceField[]).filter(f => f.required && !fieldValues[f.key]);
    if (missing.length > 0) {
      setError(`Please fill in required fields: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    setError(null);
    createMutation.mutate({
      serviceId: selectedService.id,
      projectName: projectName.trim(),
      invoiceNumber: invoiceNumber.trim(),
      startDate,
      fieldValues,
    });
  };

  const steps = [
    { number: 1, label: 'Service & Details' },
    { number: 2, label: 'Fill Details' },
    { number: 3, label: 'Confirm' },
  ];

  const invoiceStatusIcon = invoiceStatus === 'available'
    ? <CheckCircle size={15} className="text-emerald-400" />
    : invoiceStatus === 'taken'
      ? <AlertCircle size={15} className="text-red-400" />
      : null;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="page-title">Create New Project</h1>
          <p className="page-subtitle">Submit your work for admin review and approval</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-4">
          {steps.map((s, i) => (
            <React.Fragment key={s.number}>
              <div className={`flex items-center gap-2 ${step >= s.number ? 'text-blue-400' : ''}`}
                style={{ color: step >= s.number ? undefined : 'var(--text-muted)' }}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                  ${step > s.number ? 'bg-blue-600 border-blue-600 text-white' : step === s.number ? 'border-blue-500 text-blue-400' : ''}`}
                  style={step <= s.number ? { borderColor: step === s.number ? undefined : 'var(--border-default)', color: step === s.number ? undefined : 'var(--text-muted)' } : {}}>
                  {step > s.number ? <CheckCircle size={16} /> : s.number}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px" style={{ background: step > s.number ? '#2563EB' : 'var(--border-subtle)' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* ── Step 1: Service + Name + Invoice + Date ─── */}
        {step === 1 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Select Service &amp; Project Details</h2>

            {/* Project Name */}
            <div>
              <label className="label">Project Name *</label>
              <input type="text" className="input" maxLength={100}
                placeholder="project name"
                value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </div>

            {/* Invoice Number */}
            <div>
              <label className="label">Invoice Number *</label>
              {selectedService?.invoicePrefix && (
                <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Prefix hint for this service:&nbsp;
                  <span className="font-mono px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-primary)' }}>
                    {selectedService.invoicePrefix}
                  </span>
                  &nbsp;— suggested format:&nbsp;
                  <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {selectedService.invoicePrefix}-00123
                  </span>
                </p>
              )}
              <div className="relative">
                <input
                  type="text" className="input pr-8" maxLength={50}
                  placeholder={selectedService?.invoicePrefix ? `${selectedService.invoicePrefix}-00001` : 'e.g. INV-2026-001'}
                  value={invoiceNumber}
                  onChange={(e) => { setInvoiceNumber(e.target.value); setInvoiceStatus('idle'); }}
                  onBlur={() => checkInvoice(invoiceNumber)}
                />
                {invoiceStatusIcon && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">{invoiceStatusIcon}</span>
                )}
              </div>
              {invoiceStatus === 'available' && (
                <p className="text-xs mt-1 text-emerald-400">✓ Invoice number is available</p>
              )}
              {invoiceStatus === 'taken' && (
                <p className="text-xs mt-1 text-red-400">✗ This invoice number is already in use</p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="label">Start Date *</label>
              <input type="date" className="input" max={new Date().toISOString().split('T')[0]}
                value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            {/* Service Selection */}
            <div>
              <label className="label">Service *</label>
              {servicesLoading && <LoadingSpinner text="Loading your assigned services..." />}
              {servicesError && <ErrorState message="Failed to load services" />}
              {!servicesLoading && services.length === 0 && (
                <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                  <p>You have no services assigned.</p>
                  <p className="text-xs mt-1">Contact your administrator.</p>
                </div>
              )}
              <div className="space-y-2 mt-2">
                {services.filter(s => s.isActive).map((s) => (
                  <div key={s.id} onClick={() => { setSelectedService(s); setInvoiceStatus('idle'); setInvoiceNumber(''); }}
                    className={`card-sm cursor-pointer transition-all ${selectedService?.id === s.id ? 'border-blue-500 bg-blue-500/10' : ''}`}
                    style={{ borderColor: selectedService?.id === s.id ? '#3B82F6' : 'var(--border-default)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                          {s.invoicePrefix && (
                            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-primary)' }}>
                              {s.invoicePrefix}
                            </span>
                          )}
                        </div>
                        {s.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.description}</p>}
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{(s.fields as ServiceField[]).length} fields</p>
                      </div>
                      {selectedService?.id === s.id && <CheckCircle size={20} className="text-blue-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                disabled={!selectedService || !projectName.trim() || !startDate || !invoiceNumber.trim() || invoiceStatus === 'taken'}
                onClick={handleStep1Next} className="btn-primary">
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Dynamic Field Form ─── */}
        {step === 2 && selectedService && (
          <div className="card space-y-5">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedService.name}</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Fill in the project details</p>
            </div>

            {(selectedService.fields as ServiceField[]).map((field) => (
              <div key={field.key}>
                <label className="label">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea className="textarea" rows={3}
                    placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}...`}
                    value={fieldValues[field.key] ?? ''}
                    onChange={e => setFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))} />
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    className="input"
                    placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
                    value={fieldValues[field.key] ?? ''}
                    onChange={e => setFieldValues(prev => ({ ...prev, [field.key]: e.target.value }))} />
                )}
              </div>
            ))}

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary"><ChevronLeft size={18} /> Back</button>
              <button onClick={handleStep2Next} disabled={createMutation.isPending} className="btn-primary">
                {createMutation.isPending ? 'Saving...' : <>Save as Draft <ChevronRight size={18} /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm & Submit ─── */}
        {step === 3 && draftId && (
          <div className="card space-y-6">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Confirm &amp; Submit</h2>

            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Project Name</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{projectName}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Invoice Number</p>
                  <p className="text-sm font-mono font-semibold" style={{ color: 'var(--accent-primary)' }}>{invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Service</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedService?.name}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Start Date</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{startDate}</p>
                </div>
                {Object.entries(fieldValues).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{k}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <Info size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                After submission, an admin will review and approve your project. The payment amount will be
                calculated by the admin at approval time — not at submission.
              </p>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary"><ChevronLeft size={18} /> Edit Details</button>
              <button onClick={() => submitMutation.mutate(draftId!)} disabled={submitMutation.isPending} className="btn-primary btn-lg">
                {submitMutation.isPending ? 'Submitting...' : '✓ Submit for Review'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
