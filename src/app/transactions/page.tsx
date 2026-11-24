'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Receipt,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Trash2,
  Calendar,
  Wallet,
  Tag,
  Download,
  Upload,
  Eye,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { formatCurrency } from '@/lib/money';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netCashflow: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Receipt Modal
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (type) query.set('type', type);
      if (walletId) query.set('walletId', walletId);
      if (categoryId) query.set('categoryId', categoryId);
      if (startDate) query.set('startDate', startDate);
      if (endDate) query.set('endDate', endDate);

      const [txRes, wRes, cRes] = await Promise.all([
        fetch(`/api/transactions?${query.toString()}`),
        fetch('/api/wallets'),
        fetch('/api/categories'),
      ]);

      const txData = await txRes.json();
      const wData = await wRes.json();
      const cData = await cRes.json();

      setTransactions(txData.transactions || []);
      setSummary(txData.summary || { totalIncome: 0, totalExpense: 0, netCashflow: 0 });
      setWallets(wData.wallets || []);
      setCategories(cData.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('fintrack_tx_updated', handleUpdate);
    return () => window.removeEventListener('fintrack_tx_updated', handleUpdate);
  }, [type, walletId, categoryId, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini? Saldo dompet akan disesuaikan otomatis.')) {
      return;
    }

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Gagal menghapus transaksi');
      }
    } catch (e) {
      alert('Terjadi kesalahan saat menghapus');
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['ID', 'Tanggal', 'Tipe', 'Nominal', 'Dompet', 'Tujuan', 'Kategori', 'Catatan'];
    const rows = transactions.map((tx) => [
      tx.id,
      new Date(tx.date).toISOString().split('T')[0],
      tx.type,
      tx.amount,
      `"${tx.wallet?.name || ''}"`,
      `"${tx.destinationWallet?.name || ''}"`,
      `"${tx.category?.name || ''}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fintrack-transaksi-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-6 h-6 text-emerald-500" />
              <span>Riwayat Transaksi</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola, cari, dan filter seluruh catatan keuangan Anda
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Filtered Scope Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Pemasukan (Filter)
            </span>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{formatCurrency(summary.totalIncome)}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Pengeluaran (Filter)
            </span>
            <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              -{formatCurrency(summary.totalExpense)}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Selisih Bersih (Cash Flow)
            </span>
            <div
              className={`text-lg font-bold font-mono mt-0.5 ${
                summary.netCashflow >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {summary.netCashflow >= 0 ? '+' : ''}
              {formatCurrency(summary.netCashflow)}
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari transaksi berdasarkan catatan, toko, atau kategori..."
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
            >
              Cari
            </button>
          </form>

          {/* Granular dropdown filters */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">Semua Tipe</option>
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
              <option value="TRANSFER">Transfer</option>
            </select>

            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">Semua Dompet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Dari Tgl"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Sampai Tgl"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Transactions Table / List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Memuat data transaksi...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tidak ada transaksi yang cocok dengan filter
              </p>
              <p className="text-xs text-slate-400">
                Coba sesuaikan kata kunci atau bersihkan pilihan filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Tipe & Catatan</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Dompet</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map((tx) => {
                    const isIncome = tx.type === 'INCOME';
                    const isTransfer = tx.type === 'TRANSFER';
                    const dateFormatted = new Date(tx.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isIncome
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                                  : isTransfer
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                              }`}
                            >
                              {isIncome && <TrendingUp className="w-3.5 h-3.5" />}
                              {isTransfer && <ArrowRightLeft className="w-3.5 h-3.5" />}
                              {!isIncome && !isTransfer && <TrendingDown className="w-3.5 h-3.5" />}
                            </div>

                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>
                                  {isTransfer
                                    ? `Transfer ke ${tx.destinationWallet?.name || 'Tujuan'}`
                                    : tx.notes || tx.category?.name || 'Tanpa Catatan'}
                                </span>
                                {tx.isRecurring && (
                                  <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-600 px-1.5 py-0.2 rounded font-mono">
                                    Rutin
                                  </span>
                                )}
                              </div>
                              {isTransfer && tx.notes && (
                                <p className="text-[11px] text-slate-400">{tx.notes}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {dateFormatted}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isTransfer ? (
                            <span className="text-slate-400 text-[11px] italic">
                              Transfer Internal
                            </span>
                          ) : tx.category ? (
                            <span
                              className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
                              style={{
                                backgroundColor: `${tx.category.color}15`,
                                color: tx.category.color,
                              }}
                            >
                              {tx.category.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Lainnya</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {tx.wallet?.name}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                          <span
                            className={
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isTransfer
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {isIncome ? '+' : isTransfer ? '' : '-'}
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {tx.receiptUrl && (
                              <button
                                onClick={() => setViewReceipt(tx.receiptUrl)}
                                title="Lihat Struk"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(tx.id)}
                              title="Hapus Transaksi"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Pratinjau Struk */}
        {viewReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-4 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Pratinjau Foto Struk
                </span>
                <button
                  onClick={() => setViewReceipt(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-96 overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl p-2">
                <img
                  src={viewReceipt}
                  alt="Receipt Preview"
                  className="max-h-80 object-contain rounded-lg shadow-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
