'use client';

import React, { useState } from 'react';
import { X, ChevronDown, Calendar } from 'lucide-react';
import type { FilterState } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters:         FilterState;
  onChange:        (filters: FilterState) => void;
  onClear:         () => void;
  statusOptions?:  SelectOption[];
  employees?:      SelectOption[];
  services?:       SelectOption[];
  showPaymentMode?: boolean;
}

// ─── Date range presets ───────────────────────────────────────────────────────

const DATE_RANGES: SelectOption[] = [
  { value: '',             label: 'All Time'     },
  { value: 'today',        label: 'Today'        },
  { value: 'this_week',    label: 'This Week'    },
  { value: 'this_month',   label: 'This Month'   },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year',    label: 'This Year'    },
  { value: 'custom',       label: 'Custom Range' },
];

// ─── Active chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)' }}>
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
        <X size={10} />
      </button>
    </span>
  );
}

// ─── FilterBar component ──────────────────────────────────────────────────────

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  onClear,
  statusOptions,
  employees,
  services,
  showPaymentMode = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const set = (key: keyof FilterState, value: string) =>
    onChange({ ...filters, [key]: value || undefined, page: '1' });

  // Build active chip labels
  const chips: { label: string; clear: () => void }[] = [];

  if (filters.dateRange && filters.dateRange !== '') {
    const label = filters.dateRange === 'custom'
      ? `${filters.startDate ?? ''} → ${filters.endDate ?? ''}`
      : DATE_RANGES.find((d) => d.value === filters.dateRange)?.label ?? filters.dateRange;
    chips.push({ label, clear: () => onChange({ ...filters, dateRange: undefined, startDate: undefined, endDate: undefined, page: '1' }) });
  }
  if (filters.status)      chips.push({ label: `Status: ${filters.status}`,     clear: () => set('status', '')      });
  if (filters.employeeId)  chips.push({ label: 'Employee filter active',          clear: () => set('employeeId', '')  });
  if (filters.serviceId)   chips.push({ label: 'Service filter active',           clear: () => set('serviceId', '')   });
  if (filters.paymentMode) chips.push({ label: `Mode: ${filters.paymentMode}`,   clear: () => set('paymentMode', '') });

  const hasFilters = chips.length > 0;

  return (
    <div className="card space-y-3">
      {/* Top row: toggle + clear */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          Filters
          {hasFilters && (
            <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
              style={{ background: 'var(--accent-primary)', color: '#fff' }}>
              {chips.length}
            </span>
          )}
        </button>
        {hasFilters && (
          <button onClick={onClear} className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Clear All
          </button>
        )}
      </div>

      {/* Active chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {chips.map((c, i) => (
            <FilterChip key={i} label={c.label} onRemove={c.clear} />
          ))}
        </div>
      )}

      {/* Expanded filter controls */}
      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}>

          {/* Date range */}
          <div>
            <label className="label">Date Range</label>
            <select className="select" value={filters.dateRange ?? ''} onChange={(e) => set('dateRange', e.target.value)}>
              {DATE_RANGES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {/* Custom date pickers */}
          {filters.dateRange === 'custom' && (
            <>
              <div>
                <label className="label"><Calendar size={12} className="inline mr-1" />From</label>
                <input type="date" className="input" value={filters.startDate ?? ''}
                  onChange={(e) => onChange({ ...filters, startDate: e.target.value, page: '1' })} />
              </div>
              <div>
                <label className="label"><Calendar size={12} className="inline mr-1" />To</label>
                <input type="date" className="input" value={filters.endDate ?? ''}
                  onChange={(e) => onChange({ ...filters, endDate: e.target.value, page: '1' })} />
              </div>
            </>
          )}

          {/* Status */}
          {statusOptions && (
            <div>
              <label className="label">Status</label>
              <select className="select" value={filters.status ?? ''} onChange={(e) => set('status', e.target.value)}>
                <option value="">All Statuses</option>
                {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}

          {/* Employee */}
          {employees && (
            <div>
              <label className="label">Employee</label>
              <select className="select" value={filters.employeeId ?? ''} onChange={(e) => set('employeeId', e.target.value)}>
                <option value="">All Employees</option>
                {employees.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          )}

          {/* Service */}
          {services && (
            <div>
              <label className="label">Service</label>
              <select className="select" value={filters.serviceId ?? ''} onChange={(e) => set('serviceId', e.target.value)}>
                <option value="">All Services</option>
                {services.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}

          {/* Payment mode */}
          {showPaymentMode && (
            <div>
              <label className="label">Payment Mode</label>
              <select className="select" value={filters.paymentMode ?? ''} onChange={(e) => set('paymentMode', e.target.value)}>
                <option value="">All Modes</option>
                <option value="GST">GST</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
