'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  Settings,
  User,
  Shield,
  Coins,
  Moon,
  Sun,
  Lock,
  CheckCircle2,
  AlertCircle,
  Database,
  KeyRound,
  RotateCcw,
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [pinCode, setPinCode] = useState('');
  const [hasPin, setHasPin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/user/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name || '');
          setEmail(data.user.email || '');
          setCurrency(data.user.currency || 'IDR');
          setHasPin(data.user.hasPin || false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setError('');

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          currency,
          pinCode: pinCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pengaturan');

      setSuccessMsg('Pengaturan berhasil diperbarui!');
      setHasPin(data.user.hasPin);
      if (pinCode) setPinCode('');

      // Update NextAuth session state
      await update({
        name: data.user.name,
        currency: data.user.currency,
        hasPin: data.user.hasPin,
      });

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePin = async () => {
    if (!confirm('Hapus kunci PIN keamanan aplikasi?')) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          currency,
          pinCode: '', // clear PIN
        }),
      });
      const data = await res.json();
      setHasPin(false);
      setSuccessMsg('PIN keamanan berhasil dihapus.');
      sessionStorage.removeItem('fintrack_unlocked');
      await update({ hasPin: false });
    } catch (e) {
      setError('Gagal menghapus PIN');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-500" />
            <span>Pengaturan Akun & Keamanan</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Konfigurasi preferensi mata uang, PIN keamanan aplikasi, dan tampilan sistem
          </p>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Card 1: Profil Pengguna */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <User className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Profil Pengguna
                </h3>
                <p className="text-[11px] text-slate-400">
                  Nama lengkap dan alamat email akun Anda
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Email (Akun)
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Multi-Currency Support */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Coins className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Mata Uang Utama (Multi-Currency)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Pilih mata uang standar untuk format dan kalkulasi nominal
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'IDR', label: 'IDR - Rupiah Indonesia', symbol: 'Rp', note: 'Standar nasional (Default)' },
                { id: 'USD', label: 'USD - US Dollar', symbol: '$', note: '1 USD ≈ Rp16.000' },
                { id: 'SGD', label: 'SGD - Singapore Dollar', symbol: 'S$', note: '1 SGD ≈ Rp12.000' },
              ].map((curr) => (
                <label
                  key={curr.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    currency === curr.id
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-lg text-emerald-600">
                      {curr.symbol}
                    </span>
                    <input
                      type="radio"
                      name="currency"
                      value={curr.id}
                      checked={currency === curr.id}
                      onChange={() => setCurrency(curr.id)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {curr.label}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{curr.note}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Card 3: Keamanan & PIN Lock */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Kunci PIN Keamanan (App Passcode)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Kunci aplikasi dengan 4-6 digit PIN setiap membuka tab baru
                  </p>
                </div>
              </div>

              {hasPin && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> PIN Aktif
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="max-w-xs">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {hasPin ? 'Ganti PIN Keamanan Baru:' : 'Pasang PIN Baru (4-6 Digit):'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Contoh: 1234"
                    className="w-full text-sm pl-10 pr-4 py-2.5 font-mono tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {hasPin && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleRemovePin}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Nonaktifkan PIN Keamanan
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Tema Tampilan */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sun className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Mode Tema Tampilan
                </h3>
                <p className="text-[11px] text-slate-400">
                  Pilih mode gelap (Dark Mode) atau terang (Light Mode)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  theme === 'light'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Terang (Light)</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  theme === 'dark'
                    ? 'border-emerald-500 bg-slate-800 text-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4 text-blue-400" />
                <span>Gelap (Dark)</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  theme === 'system'
                    ? 'border-emerald-500 bg-emerald-50/20 text-emerald-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Otomatis (System)</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
