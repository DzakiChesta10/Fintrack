'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { formatCurrency, parseMoneyInput, roundMoney } from '@/lib/money';
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  CreditCard,
  User,
  Calendar,
  Info,
  HandCoins,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Wallet {
  id: string;
  name: string;
  color: string;
  icon: string;
}
interface Payment {
  id: string;
  amount: number;
  date: string;
  notes?: string | null;
}
interface Debt {
  id: string;
  type: 'DEBT' | 'RECEIVABLE';
  personName: string;
  amount: number;
  paidAmount: number;
  remaining: number;
  dueDate?: string | null;
  borrowDate: string;
  description?: string | null;
  notes?: string | null;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  isOverdue: boolean;
  wallet?: Wallet | null;
  payments: Payment[];
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, isOverdue }: { status: Debt['status']; isOverdue: boolean }) {
  if (status === 'PAID')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="w-3 h-3" /> Lunas
      </span>
    );
  if (isOverdue)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 animate-pulse">
        <AlertTriangle className="w-3 h-3" /> Jatuh Tempo
      </span>
    );
  if (status === 'PARTIAL')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
        <Clock className="w-3 h-3" /> Sebagian
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
      <Clock className="w-3 h-3" /> Belum Lunas
    </span>
  );
}

// ─── Debt Form Modal ──────────────────────────────────────────────────────────
function DebtFormModal({
  open,
  onClose,
  onSaved,
  initial,
  wallets,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Debt | null;
  wallets: Wallet[];
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    type: initial?.type ?? 'DEBT',
    personName: initial?.personName ?? '',
    amount: initial ? String(initial.amount) : '',
    borrowDate: initial?.borrowDate
      ? new Date(initial.borrowDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    dueDate: initial?.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 10) : '',
    description: initial?.description ?? '',
    notes: initial?.notes ?? '',
    walletId: initial?.wallet?.id ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        type: initial?.type ?? 'DEBT',
        personName: initial?.personName ?? '',
        amount: initial ? String(initial.amount) : '',
        borrowDate: initial?.borrowDate
          ? new Date(initial.borrowDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        dueDate: initial?.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 10) : '',
        description: initial?.description ?? '',
        notes: initial?.notes ?? '',
        walletId: initial?.wallet?.id ?? '',
      });
      setError('');
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseMoneyInput(form.amount);
    if (!form.personName.trim()) return setError('Nama wajib diisi');
    if (amount <= 0) return setError('Nominal harus lebih dari 0');
    setLoading(true);
    setError('');

    const payload = {
      type: form.type,
      personName: form.personName.trim(),
      amount,
      borrowDate: form.borrowDate || undefined,
      dueDate: form.dueDate || null,
      description: form.description || null,
      notes: form.notes || null,
      walletId: form.walletId || null,
    };

    const url = isEdit ? `/api/debts/${initial!.id}` : '/api/debts';
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === 'string' ? data.error : 'Gagal menyimpan');
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <HandCoins className="w-4 h-4" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">
              {isEdit ? 'Edit' : 'Tambah'} Utang / Piutang
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Tipe
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['DEBT', 'RECEIVABLE'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    form.type === t
                      ? t === 'DEBT'
                        ? 'bg-rose-600 border-rose-600 text-white shadow-sm shadow-rose-600/20'
                        : 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {t === 'DEBT' ? (
                    <>
                      <ArrowDownLeft className="w-3.5 h-3.5" /> Saya Berhutang
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-3.5 h-3.5" /> Saya Dihutangi
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Person Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {form.type === 'DEBT' ? 'Nama Kreditur (Yang Meminjamkan)' : 'Nama Debitur (Yang Berhutang)'}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={form.personName}
                onChange={(e) => setForm((f) => ({ ...f, personName: e.target.value }))}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                placeholder="cth. Budi Santoso"
                required
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Nominal
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
              <input
                type="text"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white font-mono"
                placeholder="500000"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Tanggal Pinjam
              </label>
              <input
                type="date"
                value={form.borrowDate}
                onChange={(e) => setForm((f) => ({ ...f, borrowDate: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Jatuh Tempo <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Keterangan <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
              placeholder="cth. Pinjaman modal usaha"
              maxLength={255}
            />
          </div>

          {/* Wallet Link */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Dompet Terkait <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <select
              value={form.walletId}
              onChange={(e) => setForm((f) => ({ ...f, walletId: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
            >
              <option value="">— Tidak dipilih —</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-all shadow-sm shadow-violet-600/20 disabled:opacity-60"
            >
              {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Payment Modal (Catat Cicilan/Pelunasan) ──────────────────────────────────
function PaymentModal({
  debt,
  open,
  onClose,
  onPaid,
}: {
  debt: Debt;
  open: boolean;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setAmount(String(debt.remaining));
      setDate(new Date().toISOString().slice(0, 10));
      setNotes('');
      setError('');
    }
  }, [open, debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pay = parseMoneyInput(amount);
    if (pay <= 0) return setError('Nominal harus > 0');
    if (pay > debt.remaining) return setError(`Melebihi sisa (${formatCurrency(debt.remaining)})`);
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/debts/${debt.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: pay, date, notes: notes || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        return setError(typeof d.error === 'string' ? d.error : 'Gagal menyimpan');
      }
      onPaid();
      onClose();
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white text-sm block">
                Catat Cicilan / Pelunasan
              </span>
              <span className="text-[11px] text-gray-400">
                {debt.type === 'DEBT' ? 'Utang ke' : 'Piutang dari'}{' '}
                <span className="font-semibold">{debt.personName}</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs">
            <span className="text-gray-500">Sisa yang harus dibayar:</span>
            <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
              {formatCurrency(debt.remaining)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Nominal Cicilan
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Tanggal Bayar
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Catatan <span className="font-normal text-gray-400">(opsional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              placeholder="cth. Transfer via BCA"
              maxLength={255}
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all shadow-sm disabled:opacity-60"
            >
              {loading ? 'Menyimpan...' : '✓ Catat Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Debt Card ────────────────────────────────────────────────────────────────
function DebtCard({
  debt,
  onEdit,
  onDelete,
  onPay,
}: {
  debt: Debt;
  onEdit: (d: Debt) => void;
  onDelete: (id: string) => void;
  onPay: (d: Debt) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const progress = roundMoney((debt.paidAmount / debt.amount) * 100);
  const isDebt = debt.type === 'DEBT';
  const dateStr = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-slate-900 shadow-xs transition-all ${
        debt.isOverdue
          ? 'border-rose-200 dark:border-rose-900/60'
          : debt.status === 'PAID'
          ? 'border-emerald-200 dark:border-emerald-900/40 opacity-70'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="p-4">
        {/* Top Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDebt
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isDebt ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {debt.personName}
                </span>
                <StatusBadge status={debt.status} isOverdue={debt.isOverdue} />
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {isDebt ? 'Utang' : 'Piutang'}{' '}
                {debt.description ? `· ${debt.description}` : ''}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div className="text-right shrink-0">
            <div
              className={`text-base font-black font-mono ${
                isDebt
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatCurrency(debt.amount)}
            </div>
            {debt.status !== 'PAID' && (
              <span className="text-[11px] text-slate-500 font-mono">
                Sisa: {formatCurrency(debt.remaining)}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {debt.status !== 'UNPAID' && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Sudah dibayar: {formatCurrency(debt.paidAmount)}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  progress >= 100 ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Pinjam: {dateStr(debt.borrowDate)}
          </span>
          {debt.dueDate && (
            <span
              className={`flex items-center gap-1 ${
                debt.isOverdue && debt.status !== 'PAID'
                  ? 'text-rose-500 font-semibold'
                  : ''
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Jatuh Tempo: {dateStr(debt.dueDate)}
            </span>
          )}
          {debt.wallet && (
            <span className="flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              {debt.wallet.name}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            Riwayat ({debt.payments.length})
          </button>

          <div className="flex items-center gap-2">
            {debt.status !== 'PAID' && (
              <button
                onClick={() => onPay(debt)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
              >
                <Banknote className="w-3 h-3" />
                Bayar
              </button>
            )}
            <button
              onClick={() => onEdit(debt)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(debt.id)}
              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Hapus"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Payments History */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 pb-4 pt-3 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Riwayat Pembayaran
          </span>
          {debt.payments.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Belum ada pembayaran tercatat.</p>
          ) : (
            debt.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-1.5 text-xs border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                    {formatCurrency(p.amount)}
                  </span>
                  {p.notes && (
                    <span className="text-slate-400 ml-2">· {p.notes}</span>
                  )}
                </div>
                <span className="text-slate-400 text-[11px]">
                  {new Date(p.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalReceivable, setTotalReceivable] = useState(0);

  const [filterType, setFilterType] = useState<'ALL' | 'DEBT' | 'RECEIVABLE'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');

  const [showForm, setShowForm] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [payDebt, setPayDebt] = useState<Debt | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [debtsRes, walletsRes] = await Promise.all([
        fetch('/api/debts'),
        fetch('/api/wallets'),
      ]);
      const dData = await debtsRes.json();
      const wData = await walletsRes.json();
      setDebts(dData.debts ?? []);
      setTotalDebt(dData.totalDebt ?? 0);
      setTotalReceivable(dData.totalReceivable ?? 0);
      setWallets(wData.wallets ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus catatan utang/piutang ini?')) return;
    await fetch(`/api/debts/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const filtered = debts.filter((d) => {
    if (filterType !== 'ALL' && d.type !== filterType) return false;
    if (filterStatus !== 'ALL' && d.status !== filterStatus) return false;
    return true;
  });

  const overdue = debts.filter((d) => d.isOverdue && d.status !== 'PAID');

  return (
    <AppLayout>
      {/* Forms */}
      <DebtFormModal
        open={showForm || !!editDebt}
        onClose={() => {
          setShowForm(false);
          setEditDebt(null);
        }}
        onSaved={fetchData}
        initial={editDebt}
        wallets={wallets}
      />
      {payDebt && (
        <PaymentModal
          debt={payDebt}
          open={!!payDebt}
          onClose={() => setPayDebt(null)}
          onPaid={fetchData}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <HandCoins className="w-6 h-6 text-violet-500" />
              Utang &amp; Piutang
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola hutang dan piutang beserta riwayat cicilan
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-all shadow-sm shadow-violet-600/20"
          >
            <Plus className="w-4 h-4" />
            Tambah Catatan
          </button>
        </div>

        {/* Overdue Alert */}
        {overdue.length > 0 && (
          <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-sm font-bold text-rose-800 dark:text-rose-300">
                {overdue.length} catatan sudah melewati jatuh tempo!
              </span>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                Segera selesaikan untuk menjaga kepercayaan dan reputasi keuangan Anda.
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Total Utang Aktif</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-rose-500" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
              {formatCurrency(totalDebt)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total yang masih harus Anda bayar</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Total Piutang Aktif</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalReceivable)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total yang masih harus diterima</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs font-semibold">
            {(['ALL', 'DEBT', 'RECEIVABLE'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-2 transition-colors ${
                  filterType === t
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {t === 'ALL' ? 'Semua' : t === 'DEBT' ? 'Utang' : 'Piutang'}
              </button>
            ))}
          </div>

          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs font-semibold">
            {(['ALL', 'UNPAID', 'PARTIAL', 'PAID'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 transition-colors ${
                  filterStatus === s
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {s === 'ALL'
                  ? 'Semua Status'
                  : s === 'UNPAID'
                  ? 'Belum Lunas'
                  : s === 'PARTIAL'
                  ? 'Sebagian'
                  : 'Lunas'}
              </button>
            ))}
          </div>
        </div>

        {/* Debt List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <HandCoins className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Tidak ada catatan utang/piutang
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => (
              <DebtCard
                key={d.id}
                debt={d}
                onEdit={(d) => setEditDebt(d)}
                onDelete={handleDelete}
                onPay={(d) => setPayDebt(d)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
