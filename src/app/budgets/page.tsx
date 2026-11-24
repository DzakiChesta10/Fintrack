'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Trash2,
  X,
} from 'lucide-react';
import { DynamicIcon } from '@/components/DynamicIcon';
import { formatCurrency } from '@/lib/money';

export default function BudgetsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [budgets, setBudgets] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallPercentage: 0,
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('0.8');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        fetch(`/api/budgets?year=${year}&month=${month}`),
        fetch('/api/categories?type=EXPENSE'),
      ]);

      const bData = await bRes.json();
      const cData = await cRes.json();

      setBudgets(bData.budgets || []);
      setSummary(bData.summary || { totalBudget: 0, totalSpent: 0, totalRemaining: 0, overallPercentage: 0 });
      setCategories(cData.categories || []);

      if (cData.categories?.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(cData.categories[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [year, month]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Nominal batas anggaran harus lebih dari 0');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          amount: numericAmount,
          month,
          year,
          alertThreshold: parseFloat(alertThreshold) || 0.8,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan anggaran');

      setIsModalOpen(false);
      setAmount('');
      loadBudgets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Hapus anggaran ini?')) return;
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      if (res.ok) loadBudgets();
    } catch (err) {}
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-6 h-6 text-emerald-500" />
              <span>Anggaran Bulanan (Budgeting)</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kendalikan gaya hidup dan batas pengeluaran per kategori agar tidak overbudget
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Month Navigator */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-bold text-slate-900 dark:text-white font-mono">
                {monthNames[month - 1]} {year}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setAmount('');
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pasang Anggaran</span>
            </button>
          </div>
        </div>

        {/* Overview Progress Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Anggaran Terpakai ({monthNames[month - 1]} {year})
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
                {formatCurrency(summary.totalSpent)}
                <span className="text-sm font-normal text-slate-400 font-sans ml-2">
                  dari {formatCurrency(summary.totalBudget)}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400">Sisa Anggaran Aman:</span>
              <div
                className={`text-xl font-bold font-mono ${
                  summary.totalRemaining >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatCurrency(summary.totalRemaining)}
              </div>
            </div>
          </div>

          {/* Master Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.overallPercentage > 100
                    ? 'bg-rose-500'
                    : summary.overallPercentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, summary.overallPercentage)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0%</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {summary.overallPercentage}% Terpakai
              </span>
              <span>100% Limit</span>
            </div>
          </div>
        </div>

        {/* Budgets Category Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Daftar Anggaran Kategori ({budgets.length})
            </h2>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aman (&lt;80%)
              </span>
              <span className="flex items-center gap-1 text-amber-600 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" /> Waspada (80-100%)
              </span>
              <span className="flex items-center gap-1 text-rose-600 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" /> Overbudget (&gt;100%)
              </span>
            </div>
          </div>

          {budgets.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <PieChart className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Belum ada anggaran yang ditetapkan untuk bulan ini
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-emerald-600 hover:underline font-bold"
              >
                + Buat anggaran pertama sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.map((b) => {
                const isOver = b.status === 'OVERBUDGET';
                const isWarn = b.status === 'WARNING';

                return (
                  <div
                    key={b.id}
                    className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs space-y-3 ${
                      isOver
                        ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10'
                        : isWarn
                        ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                          style={{ backgroundColor: b.category?.color || '#ea580c' }}
                        >
                          <DynamicIcon name={b.category?.icon || 'tag'} className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                            {b.category?.name}
                          </h3>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                              isOver
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                                : isWarn
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                            }`}
                          >
                            {isOver ? 'Melebihi Batas' : isWarn ? 'Mendekati Batas' : 'Aman'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteBudget(b.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, b.percentage)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(b.spent)} ({b.percentage}%)
                        </span>
                        <span className="text-slate-400">
                          Batas: {formatCurrency(b.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {isOver
                          ? `Defisit: ${formatCurrency(Math.abs(b.remaining))}`
                          : `Sisa Kuota: ${formatCurrency(b.remaining)}`}
                      </span>
                      <span>Alert di {Math.round(b.alertThreshold * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Pasang Anggaran */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Tetapkan Batas Anggaran Bulanan
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBudget} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Pengeluaran
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Batas Maksimal Pengeluaran (Rp)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Contoh: 1500000"
                    className="w-full text-base font-bold font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ambang Batas Peringatan (Alert Threshold)
                  </label>
                  <select
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="0.7">70% dari batas</option>
                    <option value="0.8">80% dari batas (Rekomendasi)</option>
                    <option value="0.9">90% dari batas</option>
                  </select>
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
                    {saving ? 'Menyimpan...' : 'Simpan Anggaran'}
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
