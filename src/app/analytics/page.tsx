'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  BarChart3,
  PieChart,
  Printer,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Award,
  Sparkles,
  Download,
} from 'lucide-react';
import { DynamicIcon } from '@/components/DynamicIcon';
import { formatCurrency } from '@/lib/money';

export default function AnalyticsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?year=${year}&month=${month}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
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

  const handlePrint = () => {
    window.print();
  };

  const overview = data?.overview || {
    totalBalance: 0,
    incomeThisMonth: 0,
    expenseThisMonth: 0,
    netCashflowThisMonth: 0,
    savingsRate: 0,
  };
  const categoryExpenses = data?.categoryExpenses || [];
  const monthlyTrend = data?.monthlyTrend || [];

  // Find top spending category
  const topCategory = categoryExpenses.length > 0 ? categoryExpenses[0] : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-500" />
              <span>Analisis & Laporan Portofolio</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualisasi rasio belanja, komposisi per kategori, dan tren arus kas bulanan
            </p>
          </div>

          <div className="flex items-center gap-2">
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
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all shadow-xs hover:opacity-90"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Title Header (Visible during Print) */}
        <div className="hidden print:block text-center pb-4 border-b border-slate-200">
          <h2 className="text-xl font-bold">Laporan Finansial Bulanan - FinTrack Pro</h2>
          <p className="text-xs text-slate-500">
            Periode: {monthNames[month - 1]} {year} &bull; Dicetak pada: {new Date().toLocaleString('id-ID')}
          </p>
        </div>

        {/* 3 Executive Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Tingkat Tabungan (Savings Rate)</span>
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {overview.savingsRate}%
              </span>
              <span className="text-xs text-slate-400">dari total pemasukan</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {overview.savingsRate >= 20
                ? 'Kesehatan finansial Sangat Baik (melebihi standar 20% tabungan bulanan).'
                : 'Pertimbangkan untuk memangkas pengeluaran non-primer agar savings rate meningkat.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>Pos Pengeluaran Terbesar</span>
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                {topCategory ? topCategory.name : 'N/A'}
              </span>
              {topCategory && (
                <span className="text-xs font-mono font-bold text-slate-400">
                  ({topCategory.percentage}%)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {topCategory
                ? `Total belanja di pos ini mencapai ${formatCurrency(topCategory.amount)}.`
                : 'Belum ada data pengeluaran.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-500" />
              <span>Arus Kas Bersih (Net Cashflow)</span>
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-2xl font-black font-mono ${
                  overview.netCashflowThisMonth >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {overview.netCashflowThisMonth >= 0 ? '+' : ''}
                {formatCurrency(overview.netCashflowThisMonth)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Pemasukan {formatCurrency(overview.incomeThisMonth)} dikurangi Pengeluaran {formatCurrency(overview.expenseThisMonth)}.
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Donut / Pie Category Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-500" />
                  <span>Komposisi Pengeluaran per Kategori</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Total Pengeluaran: {formatCurrency(overview.expenseThisMonth)}
                </p>
              </div>
            </div>

            {categoryExpenses.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Tidak ada data pengeluaran di periode ini.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {categoryExpenses.map((cat: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(cat.amount)}
                        </span>
                        <span className="w-12 text-right text-slate-500 font-semibold">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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

          {/* Chart 2: 6 Months Trend Bar Chart */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span>Tren Multi-Bulan (Income vs Expense)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Perbandingan pemasukan & pengeluaran historis
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> In
                </span>
                <span className="flex items-center gap-1 text-rose-600">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" /> Out
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {monthlyTrend.map((m: any, idx: number) => {
                const max = Math.max(
                  ...monthlyTrend.map((x: any) => Math.max(x.income, x.expense)),
                  1
                );
                const incPct = Math.min(100, (m.income / max) * 100);
                const expPct = Math.min(100, (m.expense / max) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {m.label}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-600">
                          +{formatCurrency(m.income, 'IDR', { compact: true })}
                        </span>
                        <span className="text-rose-600">
                          -{formatCurrency(m.expense, 'IDR', { compact: true })}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${incPct}%` }}
                        />
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${expPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
