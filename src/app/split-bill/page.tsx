'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Calculator,
  Receipt,
  Percent,
  Wallet,
  ArrowRight,
  Sparkles,
  Share2,
} from 'lucide-react';
import { formatCurrency, roundMoney } from '@/lib/money';

interface Participant {
  name: string;
  amount: number;
}

export default function SplitBillPage() {
  const [splitBills, setSplitBills] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');
  const [totalBill, setTotalBill] = useState('');
  const [taxPercent, setTaxPercent] = useState('10');
  const [servicePercent, setServicePercent] = useState('5');

  // Participants
  const [equalCount, setEqualCount] = useState(3);
  const [customParticipants, setCustomParticipants] = useState<Participant[]>([
    { name: 'Saya', amount: 0 },
    { name: 'Teman 1', amount: 0 },
    { name: 'Teman 2', amount: 0 },
  ]);

  // Save to expense options
  const [saveAsExpense, setSaveAsExpense] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, wRes, cRes] = await Promise.all([
        fetch('/api/split-bill'),
        fetch('/api/wallets'),
        fetch('/api/categories?type=EXPENSE'),
      ]);

      const sData = await sRes.json();
      const wData = await wRes.json();
      const cData = await cRes.json();

      setSplitBills(sData.splitBills || []);
      setWallets(wData.wallets || []);
      setCategories(cData.categories || []);

      if (wData.wallets?.length > 0 && !selectedWalletId) {
        setSelectedWalletId(wData.wallets[0].id);
      }
      if (cData.categories?.length > 0 && !selectedCategoryId) {
        const foodCat = cData.categories.find((c: any) =>
          c.name.toLowerCase().includes('makan')
        );
        setSelectedCategoryId(foodCat ? foodCat.id : cData.categories[0].id);
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

  // Calculations
  const numericSubtotal = parseFloat(totalBill) || 0;
  const taxMultiplier = 1 + (parseFloat(taxPercent) || 0) / 100;
  const serviceMultiplier = 1 + (parseFloat(servicePercent) || 0) / 100;
  const totalWithTaxAndService = roundMoney(
    numericSubtotal * (1 + (parseFloat(taxPercent) || 0) / 100 + (parseFloat(servicePercent) || 0) / 100)
  );

  let myShare = 0;
  if (mode === 'EQUAL') {
    myShare = equalCount > 0 ? roundMoney(totalWithTaxAndService / equalCount) : 0;
  } else {
    // Custom share with proportional tax & service
    const customSum = customParticipants.reduce((sum, p) => sum + (p.amount || 0), 0);
    const myBase = customParticipants[0]?.amount || 0;
    if (customSum > 0) {
      myShare = roundMoney(totalWithTaxAndService * (myBase / customSum));
    }
  }

  const handleAddParticipant = () => {
    setCustomParticipants([
      ...customParticipants,
      { name: `Teman ${customParticipants.length}`, amount: 0 },
    ]);
  };

  const handleRemoveParticipant = (index: number) => {
    if (customParticipants.length <= 2) return;
    setCustomParticipants(customParticipants.filter((_, i) => i !== index));
  };

  const handleUpdateParticipant = (index: number, field: 'name' | 'amount', value: any) => {
    const updated = [...customParticipants];
    updated[index] = { ...updated[index], [field]: value };
    setCustomParticipants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Judul patungan wajib diisi');
      return;
    }

    if (totalWithTaxAndService <= 0 || myShare <= 0) {
      setError('Total tagihan dan porsi harus lebih dari 0');
      return;
    }

    setSubmitting(true);
    try {
      const participantsCount =
        mode === 'EQUAL' ? equalCount : customParticipants.length;

      const details =
        mode === 'EQUAL'
          ? {
              taxPercent: parseFloat(taxPercent) || 0,
              servicePercent: parseFloat(servicePercent) || 0,
              mode: 'EQUAL',
              perPerson: myShare,
            }
          : {
              taxPercent: parseFloat(taxPercent) || 0,
              servicePercent: parseFloat(servicePercent) || 0,
              mode: 'CUSTOM',
              participants: customParticipants.map((p) => ({
                name: p.name,
                base: p.amount,
                finalShare:
                  customParticipants.reduce((sum, x) => sum + x.amount, 0) > 0
                    ? roundMoney(
                        totalWithTaxAndService *
                          (p.amount /
                            customParticipants.reduce((sum, x) => sum + x.amount, 0))
                      )
                    : 0,
              })),
            };

      const res = await fetch('/api/split-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          totalAmount: totalWithTaxAndService,
          myShare,
          participantsCount,
          details: JSON.stringify(details),
          saveAsExpense,
          walletId: saveAsExpense ? selectedWalletId : null,
          categoryId: saveAsExpense ? selectedCategoryId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan kalkulasi patungan');

      setSuccessMsg(
        `Kalkulasi patungan berhasil disimpan! ${
          saveAsExpense
            ? `Porsi Anda sebesar ${formatCurrency(myShare)} telah langsung dicatat ke transaksi pengeluaran.`
            : ''
        }`
      );
      setTitle('');
      setTotalBill('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSplitBill = async (id: string) => {
    if (!confirm('Hapus riwayat patungan ini?')) return;
    try {
      const res = await fetch(`/api/split-bill/${id}`, { method: 'DELETE' });
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
              <Users className="w-6 h-6 text-blue-500" />
              <span>Kalkulator Split Bill (Patungan)</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hitung pembagian tagihan makan bersama teman & simpan porsi pribadi ke pengeluaran
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form & Calculator */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-500" />
                <span>Kalkulator Patungan Tagihan</span>
              </h3>

              {/* Mode switch */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('EQUAL')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'EQUAL'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Bagi Rata (Equal)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('CUSTOM')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'CUSTOM'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Item / Kustom
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Acara / Tagihan
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Makan Malam Sushi Tei, Sewa Lapangan Futsal"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subtotal Tagihan (Rp)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={totalBill}
                    onChange={(e) => setTotalBill(e.target.value)}
                    placeholder="0"
                    className="w-full text-sm font-bold font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pajak Restoran (PB1 %)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    placeholder="10"
                    className="w-full text-sm font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Biaya Layanan (Service %)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={servicePercent}
                    onChange={(e) => setServicePercent(e.target.value)}
                    placeholder="5"
                    className="w-full text-sm font-mono p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Mode: Equal Split */}
              {mode === 'EQUAL' ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Jumlah Teman yang Ikut Patungan:
                    </label>
                    <span className="font-mono font-bold text-sm text-blue-600">
                      {equalCount} Orang
                    </span>
                  </div>

                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={equalCount}
                    onChange={(e) => setEqualCount(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-600"
                  />

                  <div className="text-[11px] text-slate-400">
                    Setiap orang membayar rata: <b className="text-slate-700 dark:text-slate-200">{formatCurrency(myShare)}</b> (termasuk pajak & service).
                  </div>
                </div>
              ) : (
                /* Mode: Custom Itemized Split */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Daftar Peserta & Pesanan Masing-Masing:
                    </span>
                    <button
                      type="button"
                      onClick={handleAddParticipant}
                      className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Peserta</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {customParticipants.map((p, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => handleUpdateParticipant(idx, 'name', e.target.value)}
                          placeholder="Nama"
                          className="flex-1 text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <input
                          type="number"
                          step="any"
                          value={p.amount || ''}
                          onChange={(e) =>
                            handleUpdateParticipant(idx, 'amount', parseFloat(e.target.value) || 0)
                          }
                          placeholder="Subtotal item"
                          className="w-36 text-xs p-2 font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Automatic Logging to Expense */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={saveAsExpense}
                    onChange={(e) => setSaveAsExpense(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    Simpan langsung <b>hanya porsi saya ({formatCurrency(myShare)})</b> ke catatan pengeluaran
                  </span>
                </label>

                {saveAsExpense && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Pilih Dompet Pemotong:
                      </label>
                      <select
                        value={selectedWalletId}
                        onChange={(e) => setSelectedWalletId(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {wallets.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({formatCurrency(w.balance)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Kategori Pengeluaran:
                      </label>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>Simpan Kalkulasi Patungan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Column: Live Calculation Summary Card */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-4 border border-slate-800">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Hasil Perhitungan Tagihan
              </span>

              <div className="border-t border-slate-800 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Dasar:</span>
                  <span className="font-mono">{formatCurrency(numericSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Pajak & Servis ({parseFloat(taxPercent) + parseFloat(servicePercent)}%):</span>
                  <span className="font-mono">
                    +{formatCurrency(totalWithTaxAndService - numericSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-slate-700 pt-2">
                  <span>Total Tagihan Akhir:</span>
                  <span className="font-mono text-emerald-400">
                    {formatCurrency(totalWithTaxAndService)}
                  </span>
                </div>
              </div>

              {/* My Share Highlight */}
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <span className="text-[11px] text-slate-300 uppercase tracking-wider block">
                  Porsi Tanggungan Anda (Saya):
                </span>
                <span className="text-2xl font-black font-mono text-white mt-1 block">
                  {formatCurrency(myShare)}
                </span>
              </div>
            </div>

            {/* Split Bill History */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Riwayat Patungan Sebelumnya
              </h3>

              {splitBills.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Belum ada riwayat patungan.
                </p>
              ) : (
                <div className="space-y-2">
                  {splitBills.slice(0, 5).map((sb) => (
                    <div
                      key={sb.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {sb.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {sb.participantsCount} orang &bull; Porsi: {formatCurrency(sb.myShare)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteSplitBill(sb.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
