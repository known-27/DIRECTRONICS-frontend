'use client';

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { FilterState } from '@/types';

interface ExportPDFButtonProps {
  onExport:  (filters: FilterState) => Promise<Blob>;
  filters:   FilterState;
  fileName?: string;
  label?:    string;
}

export const ExportPDFButton: React.FC<ExportPDFButtonProps> = ({
  onExport,
  filters,
  fileName = `export_${Date.now()}.pdf`,
  label    = 'Export PDF',
}) => {
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleClick = async () => {
    setLoading(true);
    try {
      const blob = await onExport(filters);
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('success', 'PDF exported successfully');
    } catch {
      showToast('error', 'Failed to export PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-secondary flex items-center gap-2"
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" /> Generating...</>
          : <><Download size={15} /> {label}</>
        }
      </button>

      {toast && (
        <div
          className={`absolute top-full mt-2 right-0 px-3 py-2 rounded-lg text-xs font-medium shadow-lg z-50 whitespace-nowrap animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default ExportPDFButton;
