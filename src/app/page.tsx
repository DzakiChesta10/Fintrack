'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  DollarSign,
  Plus,
  Sparkles,
  Camera,
  Users,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Target,
} from 'lucide-react';
import { DynamicIcon } from '@/components/DynamicIcon';
import { formatCurrency } from '@/lib/money';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleUpdate = () => {
      fetchDashboardData();
    };

    window.addEventListener('fintrack_tx_updated', handleUpdate);
    return () => window.removeEventListener('fintrack_tx_updated', handleUpdate);
  }, []);

  if (loading && !data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Memuat ringkasan portofolio...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const overview = data?.overview || {
    totalBalance: 0,
    incomeThisMonth: 0,
    expenseThisMonth: 0,
    netCashflowThisMonth: 0,
    savingsRate: 0,
  };

  const wallets = data?.wallets || [];
  const categoryExpenses = data?.categoryExpenses || [];
  const monthlyTrend = data?.monthlyTrend || [];
  const recentTransactions = data?.recentTransactions || [];
  const savingsGoals = data?.savingsGoals || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Summary Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Ringkasan Keuangan
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Periode Bulan Ini &bull; Status Arus Kas Real-time
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/split-bill"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>Split Bill</span>
            </Link>

            <Link
              href="/transactions"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20"
            >
              <span>Lihat Semua Transaksi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Balance */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Total Saldo Kekayaan
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(overview.totalBalance)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tersebar di {wallets.length} Dompet / Akun</span>
            </div>
          </div>

          {/* 2. Income This Month */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Pemasukan Bulan Ini
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(overview.incomeThisMonth)}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <span>vs Bulan lalu: {formatCurrency(overview.incomePrevMonth || 0)}</span>
            </div>
          </div>

          {/* 3. Expense This Month */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Pengeluaran Bulan Ini
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black font-mono tracking-tight text-rose-600 dark:text-rose-400">
              {formatCurrency(overview.expenseThisMonth)}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <span>Batas terkendali</span>
            </div>
          </div>

          {/* 4. Net Cashflow */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Net Cash Flow
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`mt-3 text-2xl font-black font-mono tracking-tight ${
                overview.netCashflowThisMonth >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {overview.netCashflowThisMonth >= 0 ? '+' : ''}
              {formatCurrency(overview.netCashflowThisMonth)}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium">
              Savings Rate: <span className="text-emerald-600 font-bold">{overview.savingsRate}%</span>
            </div>
          </div>
        </div>

        {/* Wallets Horizontal Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>Multi-Dompet & Saldo Terpisah</span>
            </h2>
            <Link
              href="/wallets"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Kelola Dompet &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {wallets.map((w: any) => (
              <div
                key={w.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: w.color || '#3b82f6' }}
                    >
                      <DynamicIcon name={w.icon} className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[120px]">
                        {w.name}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        {w.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                  {formatCurrency(w.balance)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Trend Bar Chart (Last 6 Months) */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tren Pemasukan vs Pengeluaran
                </h3>
                <p className="text-[11px] text-slate-400">
                  Perbandingan performa arus kas 6 bulan terakhir
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">Pemasukan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-rose-500" />
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">Pengeluaran</span>
                </div>
              </div>
            </div>

            {/* Custom Responsive SVG / HTML Bar Chart */}
            <div className="space-y-4 pt-2">
              {monthlyTrend.map((item: any, idx: number) => {
                const maxVal = Math.max(
                  ...monthlyTrend.map((m: any) => Math.max(m.income, m.expense)),
                  1
                );
                const incomePercent = Math.min(100, (item.income / maxVal) * 100);
                const expensePercent = Math.min(100, (item.expense / maxVal) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(item.income, 'IDR', { compact: true })}
                        </span>
                        <span className="text-rose-600 dark:text-rose-400">
                          -{formatCurrency(item.expense, 'IDR', { compact: true })}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${incomePercent}%` }}
                        />
                      </div>
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full transition-all duration-500"
                          style={{ width: `${expensePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donut / Expense Breakdown by Category */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pengeluaran per Kategori
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Eksklusif pengeluaran (tanpa transfer internal)
                  </p>
                </div>
                <Link
                  href="/budgets"
                  className="text-xs text-emerald-600 hover:underline font-semibold"
                >
                  Anggaran
                </Link>
              </div>

              {categoryExpenses.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada pengeluaran di bulan ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryExpenses.slice(0, 5).map((cat: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(cat.amount)}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            ({cat.percentage}%)
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Savings Goals mini teaser */}
            {savingsGoals.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Target className="w-3.5 h-3.5 text-emerald-500" />
                    Target Teratas: {savingsGoals[0].name}
                  </span>
                  <span className="font-mono text-emerald-600">
                    {Math.round((savingsGoals[0].currentAmount / savingsGoals[0].targetAmount) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min(100, (savingsGoals[0].currentAmount / savingsGoals[0].targetAmount) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Aktivitas Transaksi Terbaru
              </h3>
              <p className="text-[11px] text-slate-400">
                Catatan pemasukan, pengeluaran, dan mutasi saldo terbaru
              </p>
            </div>
            <Link
              href="/transactions"
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              Buka Semua &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada transaksi tersimpan.
              </div>
            ) : (
              recentTransactions.map((tx: any) => {
                const isIncome = tx.type === 'INCOME';
                const isTransfer = tx.type === 'TRANSFER';
                const dateStr = new Date(tx.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : isTransfer
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isIncome && <TrendingUp className="w-4 h-4" />}
                        {isTransfer && <ArrowRightLeft className="w-4 h-4" />}
                        {!isIncome && !isTransfer && <TrendingDown className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>
                            {isTransfer
                              ? `Transfer: ${tx.wallet?.name} ➔ ${tx.destinationWallet?.name || 'Tujuan'}`
                              : tx.notes || tx.category?.name || 'Transaksi'}
                          </span>
                          {tx.receiptUrl && (
                            <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-600 px-1.5 py-0.2 rounded font-normal">
                              Struk
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{dateStr}</span>
                          <span>&bull;</span>
                          <span className="font-medium text-slate-600 dark:text-slate-300">
                            {tx.wallet?.name}
                          </span>
                          {!isTransfer && tx.category && (
                            <>
                              <span>&bull;</span>
                              <span
                                className="px-1.5 py-0.2 rounded text-[10px] font-medium"
                                style={{
                                  backgroundColor: `${tx.category.color}15`,
                                  color: tx.category.color,
                                }}
                              >
                                {tx.category.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-bold font-mono ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isTransfer
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : isTransfer ? '' : '-'}
                        {formatCurrency(tx.amount)}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        {tx.type}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
