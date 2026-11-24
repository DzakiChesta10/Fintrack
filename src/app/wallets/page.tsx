'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Wallet,
  Plus,
  ArrowRightLeft,
  Edit2,
  Trash2,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
  Landmark,
  X,
} from 'lucide-react';
import { DynamicIcon } from '@/components/DynamicIcon';
import { formatCurrency } from '@/lib/money';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<any>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [icon, setIcon] = useState('landmark');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Transfer Modal
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [destWalletId, setDestWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');

  const loadWallets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wallets');
      const data = await res.json();
      setWallets(data.wallets || []);
      setTotalBalance(data.totalBalance || 0);

      if (data.wallets?.length >= 2) {
        setSourceWalletId(data.wallets[0].id);
        setDestWalletId(data.wallets[1].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const openCreateModal = () => {
    setEditingWallet(null);
    setName('');
    setType('BANK');
    setBalance('0');
    setColor('#2563eb');
    setIcon('landmark');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (w: any) => {
    setEditingWallet(w);
    setName(w.name);
    setType(w.type);
    setBalance(String(w.balance));
    setColor(w.color);
    setIcon(w.icon);
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const numericBalance = parseFloat(balance) || 0;
      const url = editingWallet
        ? `/api/wallets/${editingWallet.id}`
        : '/api/wallets';
      const method = editingWallet ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          balance: numericBalance,
          color,
          icon,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan dompet');

      setIsModalOpen(false);
      loadWallets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (!confirm('Hapus dompet ini?')) return;
    try {
      const res = await fetch(`/api/wallets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus dompet');
      } else {
        loadWallets();
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus');
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    const numericAmount = parseFloat(transferAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setTransferError('Nominal transfer harus lebih dari 0');
      return;
    }

    if (sourceWalletId === destWalletId) {
      setTransferError('Dompet sumber dan dompet tujuan tidak boleh sama');
      return;
    }

    setTransferLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TRANSFER',
          amount: numericAmount,
          date: new Date().toISOString(),
          walletId: sourceWalletId,
          destinationWalletId: destWalletId,
          notes: transferNotes.trim() || 'Transfer Antar-Dompet',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal transfer saldo');

      setIsTransferOpen(false);
      setTransferAmount('');
      setTransferNotes('');
      loadWallets();
    } catch (err: any) {
      setTransferError(err.message);
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-emerald-500" />
              <span>Multi-Dompet & Saldo Akun</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola kas tunai, rekening bank, dan dompet digital dengan transfer internal
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTransferOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
              <span>Transfer Antar-Dompet</span>
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Dompet Baru</span>
            </button>
          </div>
        </div>

        {/* Wealth Net Worth Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                Total Kekayaan Bersih (Net Worth)
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight mt-1">
                {formatCurrency(totalBalance)}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Terdistribusi secara aman di seluruh {wallets.length} dompet aktif tanpa floating-point error.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Presisi Terverifikasi
              </span>
            </div>
          </div>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((w) => (
            <div
              key={w.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: w.color }}
                    >
                      <DynamicIcon name={w.icon} className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {w.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                        Tipe: {w.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(w)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWallet(w.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Saldo Saat Ini
                  </span>
                  <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    {formatCurrency(w.balance)}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>{w._count?.transactions || 0} riwayat mutasi</span>
                <button
                  onClick={() => {
                    setSourceWalletId(w.id);
                    setIsTransferOpen(true);
                  }}
                  className="text-emerald-600 hover:underline font-semibold"
                >
                  Transfer Dana &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Tambah / Edit Dompet */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {editingWallet ? 'Ubah Informasi Dompet' : 'Tambah Dompet Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveWallet} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Dompet / Akun
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Rekening BCA, Dompet Tunai, GoPay"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tipe Akun
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="BANK">Bank</option>
                      <option value="CASH">Tunai (Cash)</option>
                      <option value="E_WALLET">E-Wallet</option>
                      <option value="INVESTMENT">Investasi</option>
                      <option value="CREDIT_CARD">Kartu Kredit</option>
                      <option value="OTHER">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Saldo Sekarang
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Warna Aksen
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
                      <option value="landmark">Landmark / Bank</option>
                      <option value="banknote">Banknote / Tunai</option>
                      <option value="smartphone">Smartphone / E-Wallet</option>
                      <option value="trending-up">Trending Up / Investasi</option>
                      <option value="credit-card">Credit Card</option>
                      <option value="wallet">Wallet</option>
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
                    {saving ? 'Menyimpan...' : 'Simpan Dompet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Transfer Antar-Dompet */}
        {isTransferOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Transfer Antar-Dompet
                  </h3>
                </div>
                <button
                  onClick={() => setIsTransferOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
                Transfer internal hanya memindahkan saldo antar dompet tanpa menambah pemasukan atau pengeluaran baru.
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dompet Asal (Sumber Dana)
                  </label>
                  <select
                    value={sourceWalletId}
                    onChange={(e) => setSourceWalletId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatCurrency(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dompet Tujuan
                  </label>
                  <select
                    value={destWalletId}
                    onChange={(e) => setDestWalletId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {wallets
                      .filter((w) => w.id !== sourceWalletId)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({formatCurrency(w.balance)})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nominal Transfer (Rp)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0"
                    className="w-full text-base font-bold font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Transfer (Opsional)
                  </label>
                  <input
                    type="text"
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    placeholder="Contoh: Topup GoPay, Tarik tunai ATM"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {transferError && (
                  <p className="text-xs text-rose-500 font-semibold">{transferError}</p>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsTransferOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={transferLoading}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {transferLoading ? 'Memproses...' : 'Eksekusi Transfer'}
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
