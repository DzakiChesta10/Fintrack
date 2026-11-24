'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Target,
  Plus,
  Coins,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  X,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { DynamicIcon } from '@/components/DynamicIcon';
import { formatCurrency } from '@/lib/money';

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('target');
  const [walletId, setWalletId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Modal Deposit / Withdraw
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [fundAction, setFundAction] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [fundAmount, setFundAmount] = useState('');
  const [deductWallet, setDeductWallet] = useState(true);
  const [actionWalletId, setActionWalletId] = useState('');
  const [fundLoading, setFundLoading] = useState(false);
  const [fundError, setFundError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [gRes, wRes] = await Promise.all([
        fetch('/api/savings-goals'),
        fetch('/api/wallets'),
      ]);

      const gData = await gRes.json();
      const wData = await wRes.json();

      setGoals(gData.goals || []);
      setWallets(wData.wallets || []);

      if (wData.wallets?.length > 0 && !actionWalletId) {
        setActionWalletId(wData.wallets[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericTarget = parseFloat(targetAmount);
    if (isNaN(numericTarget) || numericTarget <= 0) {
      setError('Target dana harus lebih dari 0');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          targetAmount: numericTarget,
          currentAmount: parseFloat(currentAmount) || 0,
          targetDate: targetDate ? targetDate : null,
          color,
          icon,
          walletId: walletId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan target');

      setIsModalOpen(false);
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFundError('');

    const numericAmount = parseFloat(fundAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFundError('Nominal harus lebih dari 0');
      return;
    }

    setFundLoading(true);
    try {
      const res = await fetch(`/api/savings-goals/${selectedGoal.id}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          type: fundAction,
          deductWallet,
          walletId: deductWallet ? actionWalletId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses alokasi tabungan');

      setSelectedGoal(null);
      setFundAmount('');
      loadData();
    } catch (err: any) {
      setFundError(err.message);
    } finally {
      setFundLoading(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Hapus target tabungan ini?')) return;
    try {
      const res = await fetch(`/api/savings-goals/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {}
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-500" />
              <span>Target Tabungan (Savings Goals)</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rencanakan dana darurat, pembelian gadget, atau impian liburan Anda
            </p>
          </div>

          <button
            onClick={() => {
              setError('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Target Baru</span>
          </button>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const isCompleted = g.isAchieved;

            return (
              <div
                key={g.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs flex flex-col justify-between group space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                        style={{ backgroundColor: g.color || '#10b981' }}
                      >
                        <DynamicIcon name={g.icon || 'target'} className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {g.name}
                        </h3>
                        {isCompleted ? (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Target Tercapai!
                          </span>
                        ) : g.daysLeft !== null ? (
                          <span className="text-[11px] text-slate-400">
                            {g.daysLeft > 0 ? `${g.daysLeft} hari lagi` : 'Target waktu telah tiba'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Tanpa batas waktu</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between mt-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Terkumpul
                      </span>
                      <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(g.currentAmount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Target Dana
                      </span>
                      <div className="text-xs font-semibold font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(g.targetAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 mt-2">
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, g.percentage)}%`,
                          backgroundColor: g.color || '#10b981',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>{g.percentage}%</span>
                      <span>Sisa: {formatCurrency(g.remaining)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Nabung / Tarik */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedGoal(g);
                      setFundAction('DEPOSIT');
                      setFundAmount('');
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Nabung</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedGoal(g);
                      setFundAction('WITHDRAW');
                      setFundAmount('');
                    }}
                    className="flex-1 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Tarik</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Buat Target Baru */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Buat Target Tabungan Baru
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveGoal} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Target Impian
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Dana Darurat, Beli MacBook, Liburan Jepang"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Nominal (Rp)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="0"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Saldo Awal
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      placeholder="0"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Tanggal Dicapai (Opsional)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Warna
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <span className="text-xs font-mono text-slate-500">{color}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ikon
                    </label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="target">Target</option>
                      <option value="shield-alert">Shield / Dana Darurat</option>
                      <option value="laptop">Laptop / Gadget</option>
                      <option value="plane">Plane / Liburan</option>
                      <option value="car">Car / Kendaraan</option>
                      <option value="home">Home / Rumah</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-rose-500 font-semibold">{error}</p>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Target'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Alokasi Nabung / Tarik Dana */}
        {selectedGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {fundAction === 'DEPOSIT' ? 'Alokasi Tabungan' : 'Tarik Dana Tabungan'} : {selectedGoal.name}
                </h3>
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFundSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nominal {fundAction === 'DEPOSIT' ? 'Nabung' : 'Pencairan'} (Rp)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="Contoh: 500000"
                    className="w-full text-base font-bold font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={deductWallet}
                      onChange={(e) => setDeductWallet(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      {fundAction === 'DEPOSIT'
                        ? 'Potong saldo dompet & catat pengeluaran otomatis'
                        : 'Tambah saldo dompet & catat pemasukan otomatis'}
                    </span>
                  </label>

                  {deductWallet && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Pilih Dompet Terkait:
                      </label>
                      <select
                        value={actionWalletId}
                        onChange={(e) => setActionWalletId(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {wallets.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({formatCurrency(w.balance)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {fundError && (
                  <p className="text-xs text-rose-500 font-semibold">{fundError}</p>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedGoal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={fundLoading}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {fundLoading ? 'Memproses...' : 'Konfirmasi Transaksi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
