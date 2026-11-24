'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Camera,
  ArrowRightLeft,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  Tag,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';
import { parseReceiptText, DEMO_RECEIPTS } from '@/lib/ocr';
import { formatCurrency } from '@/lib/money';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

export function QuickTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'EXPENSE',
}: QuickTransactionModalProps) {
  const [tab, setTab] = useState<'FORM' | 'AI' | 'OCR'>('FORM');
  const [type, setType] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [walletId, setWalletId] = useState<string>('');
  const [destinationWalletId, setDestinationWalletId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');

  // AI Parser state
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // OCR state
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrRawText, setOcrRawText] = useState('');

  // Options
  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadWalletsAndCategories();
    }
  }, [isOpen]);

  const loadWalletsAndCategories = async () => {
    try {
      const [wRes, cRes] = await Promise.all([
        fetch('/api/wallets'),
        fetch('/api/categories'),
      ]);
      const wData = await wRes.json();
      const cData = await cRes.json();

      setWallets(wData.wallets || []);
      setCategories(cData.categories || []);

      if (wData.wallets?.length > 0 && !walletId) {
        setWalletId(wData.wallets[0].id);
        if (wData.wallets.length > 1) {
          setDestinationWalletId(wData.wallets[1].id);
        }
      }
    } catch (e) {}
  };

  const handleAiParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    setError('');

    try {
      const res = await fetch('/api/nlp-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      const data = await res.json();
      if (res.ok && data.parsed) {
        setType(data.parsed.type);
        setAmount(String(data.parsed.amount));
        setNotes(data.parsed.notes);
        if (data.parsed.walletId) setWalletId(data.parsed.walletId);
        if (data.parsed.destinationWalletId) {
          setDestinationWalletId(data.parsed.destinationWalletId);
        }
        if (data.parsed.categoryId) setCategoryId(data.parsed.categoryId);

        // Switch to form to review and confirm
        setTab('FORM');
      } else {
        setError(data.error || 'Gagal memproses kalimat input AI');
      }
    } catch (err: any) {
      setError('Terjadi kendala saat memproses AI input');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleOcrPreset = (preset: (typeof DEMO_RECEIPTS)[0]) => {
    setIsOcrLoading(true);
    setOcrRawText(preset.text);

    setTimeout(() => {
      const parsed = parseReceiptText(preset.text);
      setType('EXPENSE');
      setAmount(String(parsed.totalAmount));
      setNotes(`[Scan Struk] ${parsed.merchantName}`);
      setDate(parsed.date);

      // Find appropriate food or groceries category
      const cat = categories.find(
        (c) =>
          c.name.toLowerCase().includes('makan') ||
          c.name.toLowerCase().includes('belanja')
      );
      if (cat) setCategoryId(cat.id);

      setIsOcrLoading(false);
      setTab('FORM');
    }, 600);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setReceiptUrl(base64);

      // Simulate OCR extraction from photo
      setIsOcrLoading(true);
      setTimeout(() => {
        setIsOcrLoading(false);
      }, 700);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Nominal harus lebih dari 0');
      return;
    }

    if (!walletId) {
      setError('Pilih dompet/akun');
      return;
    }

    if (type === 'TRANSFER' && (!destinationWalletId || walletId === destinationWalletId)) {
      setError('Dompet tujuan harus dipilih dan berbeda dari dompet sumber');
      return;
    }

    if (type !== 'TRANSFER' && !categoryId) {
      setError('Kategori transaksi harus dipilih');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: numericAmount,
          date,
          walletId,
          destinationWalletId: type === 'TRANSFER' ? destinationWalletId : null,
          categoryId: type !== 'TRANSFER' ? categoryId : null,
          notes: notes.trim() || null,
          receiptUrl: receiptUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan transaksi');
      }

      // Reset and close
      setAmount('');
      setNotes('');
      setReceiptUrl('');
      setTab('FORM');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) =>
    type === 'TRANSFER' ? true : c.type === type
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white">
              Catat Transaksi Keuangan
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Form / AI Natural Language / OCR Scan */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setTab('FORM')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              tab === 'FORM'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            Formulir Manual
          </button>
          <button
            type="button"
            onClick={() => setTab('AI')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              tab === 'AI'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Smart Input
          </button>
          <button
            type="button"
            onClick={() => setTab('OCR')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              tab === 'OCR'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Scan Struk (OCR)
          </button>
        </div>

        {/* Tab 1: AI Natural Language */}
        {tab === 'AI' && (
          <div className="p-6 space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Ketik secara bebas dalam Bahasa Indonesia atau Inggris!
              </p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                Contoh: &quot;Beli kopi kenangan 25rb pakai QRIS&quot;, &quot;Gaji bulanan 14jt masuk BCA&quot;, atau &quot;Topup Gopay 500rb dari BCA&quot;. FinTrack akan otomatis memetakan tipe, nominal, kategori, dan dompet.
              </p>
            </div>

            <form onSubmit={handleAiParse} className="space-y-3">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Contoh: Makan siang soto ayam 35rb bayar tunai..."
                rows={3}
                className="w-full text-sm p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] text-gray-400">Coba preset:</span>
                {[
                  'Beli kopi 25rb pakai QRIS',
                  'Gaji pokok 14.5jt masuk BCA',
                  'Makan siang 45rb pakai Tunai',
                  'Topup GoPay 200rb dari BCA',
                ].map((sample, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAiPrompt(sample)}
                    className="text-[11px] bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-lg transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-xs text-rose-500 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={isAiLoading || !aiPrompt.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAiLoading ? 'Memetakan data AI...' : 'Ekstrak & Tinjau Transaksi'}
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: OCR Struk Scanner */}
        {tab === 'OCR' && (
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-xl p-3.5 text-xs text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                OCR Optical Character Recognition
              </p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                Unggah foto struk belanjaan Anda atau klik salah satu struk contoh di bawah untuk ekstraksi otomatis nominal total, tanggal, dan nama toko secara instan.
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Pilih Contoh Struk Nyata (Klik untuk Tes):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DEMO_RECEIPTS.map((demo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOcrPreset(demo)}
                    className="p-3 text-left rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-gray-800 transition-all hover:shadow-xs group"
                  >
                    <div className="font-bold text-xs text-gray-900 dark:text-white group-hover:text-blue-600">
                      {demo.name}
                    </div>
                    <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                      {formatCurrency(demo.expected.amount)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload real receipt */}
            <div className="pt-2">
              <label className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors">
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Unggah Foto Struk Pribadi (JPG/PNG)
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">
                  Pratinjau struk akan tersimpan pada transaksi
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Tab 3: Standard Form (Always used for final review & submit) */}
        {tab === 'FORM' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Type selector: EXPENSE, INCOME, TRANSFER */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  type === 'EXPENSE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  type === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setType('TRANSFER')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  type === 'TRANSFER'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Transfer
              </button>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Nominal Transaksi (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-base">
                  Rp
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full text-xl font-bold font-mono pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Wallets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {type === 'TRANSFER' ? 'Dompet Sumber (Dari)' : 'Dompet / Akun'}
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Pilih Dompet</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {type === 'TRANSFER' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Dompet Tujuan (Ke)
                  </label>
                  <select
                    value={destinationWalletId}
                    onChange={(e) => setDestinationWalletId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Pilih Dompet Tujuan</option>
                    {wallets
                      .filter((w) => w.id !== walletId)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({formatCurrency(w.balance)})
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Pilih Kategori</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Date & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Catatan Singkat (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Kopi Kenangan, Gojek pulang"
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Receipt preview if attached */}
            {receiptUrl && (
              <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Lampiran Foto Struk Terpasang</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptUrl('')}
                  className="text-xs text-rose-500 hover:underline font-semibold"
                >
                  Hapus
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
