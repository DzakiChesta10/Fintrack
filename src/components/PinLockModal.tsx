'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Lock, Unlock, KeyRound, ShieldCheck } from 'lucide-react';

export function PinLockModal() {
  const { data: session } = useSession();
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (session?.user && (session.user as any).hasPin) {
      const unlocked = sessionStorage.getItem('fintrack_unlocked');
      if (!unlocked) {
        setIsLocked(true);
      }
    }
    setHasChecked(true);
  }, [session]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Fetch user settings to verify PIN
    try {
      const res = await fetch('/api/user/settings');
      const data = await res.json();
      // If PIN matches or demo pass
      if (data.user?.pinCode === pin || pin === '1234') {
        sessionStorage.setItem('fintrack_unlocked', 'true');
        setIsLocked(false);
        setPin('');
      } else {
        setError('PIN salah. Silakan coba lagi (Default PIN: 1234)');
      }
    } catch (err) {
      setError('Gagal memverifikasi PIN');
    }
  };

  if (!hasChecked || !isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-2xl text-center animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Aplikasi FinTrack Terkunci
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
          Masukkan PIN keamanan Anda untuk mengakses portofolio keuangan.
        </p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="••••"
              autoFocus
              className="w-full text-center text-3xl tracking-widest font-mono py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            Buka Kunci
          </button>
        </form>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          💡 Demo Seed PIN: <code className="font-mono font-bold text-emerald-600 dark:text-emerald-400">1234</code>
        </p>
      </div>
    </div>
  );
}
