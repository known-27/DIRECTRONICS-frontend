'use client';

import React, { useState, useCallback } from 'react';
import { X, PlusCircle, Trash2, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { paymentsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/formatCurrency';
import type { Payment, PaymentTransaction } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface PaymentDrawerProps {
  payment:  Payment;
  onClose:  () => void;
  onUpdate: (updated: Payment) => void;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function PaymentProgress({ totalPaid, calculatedAmount }: { totalPaid: number; calculatedAmount: number }) {
  const pct = calculatedAmount > 0 ? Math.min(100, Math.round((totalPaid / calculatedAmount) * 100)) : 0;
  const color = pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-orange-500' : 'bg-slate-600';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{formatCurrency(totalPaid)} paid</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-700/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>Pending: {formatCurrency(calculatedAmount - totalPaid)}</span>
        <span>Total: {formatCurrency(calculatedAmount)}</span>
      </div>
    </div>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────

function TransactionRow({
  tx,
  paymentId,
  paymentStatus,
  onReversed,
}: {
  tx:            PaymentTransaction;
  paymentId:     string;
  paymentStatus: string;
  onReversed:    (updated: Payment) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const handleReverse = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsApi.reverseTransaction(paymentId, tx.id);
      onReversed(res.data.data as Payment);
      setConfirming(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to reverse transaction';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-3 py-3 border-t border-slate-800 first:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span className="font-semibold text-slate-100">{formatCurrency(tx.amount)}</span>
          <span className="text-xs text-slate-500">
            {new Date(tx.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
        {tx.paidByName && (
          <p className="text-xs text-slate-500 mt-0.5 ml-6">by {tx.paidByName}</p>
        )}
        {tx.note && (
          <p className="text-xs text-slate-400 mt-1 ml-6 italic">&quot;{tx.note}&quot;</p>
        )}
        {error && <p className="text-xs text-red-400 mt-1 ml-6">{error}</p>}
      </div>

      {paymentStatus !== 'PAID' || true ? (  /* always show reverse for admins */
        confirming ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-amber-400">Reverse?</span>
            <button
              onClick={handleReverse}
              disabled={loading}
              className="btn btn-danger btn-sm"
            >
              {loading ? '…' : 'Yes'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="btn btn-secondary btn-sm"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="btn btn-ghost btn-sm flex-shrink-0 text-slate-500 hover:text-red-400"
            title="Reverse this transaction"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )
      ) : null}
    </div>
  );
}

// ─── Add Transaction Form ─────────────────────────────────────────────────────

function AddTransactionForm({
  payment,
  onAdded,
}: {
  payment:  Payment;
  onAdded:  (updated: Payment) => void;
}) {
  const [amount,  setAmount]  = useState('');
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const maxAmount = payment.pendingAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amt = Math.round(Number(amount));
    if (!amt || amt <= 0) { setError('Enter a positive whole-number amount'); return; }
    if (amt > maxAmount)  { setError(`Amount exceeds pending balance of ${formatCurrency(maxAmount)}`); return; }

    setLoading(true);
    try {
      const res = await paymentsApi.addTransaction(payment.id, { amount: amt, note: note.trim() || undefined });
      onAdded(res.data.data as Payment);
      setAmount('');
      setNote('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to record payment';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t border-slate-800">
      <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <PlusCircle className="w-4 h-4 text-blue-400" />
        Record New Payment
      </h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount (₹) *</label>
          <input
            type="number"
            min={1}
            max={maxAmount}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Max ${maxAmount.toLocaleString('en-IN')}`}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="e.g. First instalment"
            className="input"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !amount}
        className="btn btn-primary w-full"
      >
        {loading ? 'Recording…' : 'Record Payment'}
      </button>
    </form>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export function PaymentDrawer({ payment: initialPayment, onClose, onUpdate }: PaymentDrawerProps) {
  const [payment, setPayment] = useState<Payment>(initialPayment);

  const handleUpdate = useCallback((updated: Payment) => {
    setPayment(updated);
    onUpdate(updated);
  }, [onUpdate]);

  const isFullyPaid = payment.status === 'PAID' || payment.status === 'CANCELLED';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-slate-900 border-l border-slate-800 shadow-2xl animate-slide-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Payment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">#{payment.project?.invoiceNumber ?? payment.id.slice(0, 8)}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={payment.status} />
            <button onClick={onClose} className="btn btn-ghost btn-sm p-1.5">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Project info */}
          <div className="card-sm space-y-1">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Project</p>
            <p className="text-sm font-semibold text-slate-200">{payment.project?.projectName ?? '—'}</p>
            <p className="text-xs text-slate-400">{payment.project?.service?.name ?? ''}</p>
            <p className="text-xs text-slate-500">Employee: {payment.employee?.name ?? '—'}</p>
          </div>

          {/* Progress */}
          <PaymentProgress
            totalPaid={payment.totalPaid}
            calculatedAmount={payment.calculatedAmount}
          />

          {/* Summary grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Calculated', value: payment.calculatedAmount, color: 'text-slate-300' },
              { label: 'Paid',       value: payment.totalPaid,        color: 'text-emerald-400' },
              { label: 'Pending',    value: payment.pendingAmount,     color: 'text-amber-400'  },
            ].map(({ label, value, color }) => (
              <div key={label} className="card-sm text-center p-3">
                <p className={`text-base font-bold ${color}`}>{formatCurrency(value)}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Transaction history */}
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-2">
              Transactions ({payment.transactions?.length ?? 0})
            </h4>
            {(payment.transactions?.length ?? 0) === 0 ? (
              <p className="text-xs text-slate-600 italic py-2">No transactions yet.</p>
            ) : (
              payment.transactions!.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  paymentId={payment.id}
                  paymentStatus={payment.status}
                  onReversed={handleUpdate}
                />
              ))
            )}
          </div>

          {/* Add form — only when not fully settled */}
          {!isFullyPaid && (
            <AddTransactionForm payment={payment} onAdded={handleUpdate} />
          )}

          {isFullyPaid && payment.status === 'PAID' && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
              <CheckCircle2 className="w-4 h-4" />
              Payment fully settled on{' '}
              {payment.paidAt
                ? new Date(payment.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
