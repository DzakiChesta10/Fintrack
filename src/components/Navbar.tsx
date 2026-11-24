'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  Menu,
  Sun,
  Moon,
  LogOut,
  Bell,
  Sparkles,
  ChevronDown,
  User,
  Shield,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onOpenQuickAdd: () => void;
}

export function Navbar({ onToggleMobileSidebar, onOpenQuickAdd }: NavbarProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currency, setCurrency] = useState('IDR');
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    if (session?.user) {
      setCurrency((session.user as any).currency || 'IDR');
    }

    // Check budget alert notifications
    fetch('/api/budgets')
      .then((res) => res.json())
      .then((data) => {
        const alerts: any[] = [];
        if (data.budgets) {
          data.budgets.forEach((b: any) => {
            if (b.status === 'OVERBUDGET') {
              alerts.push({
                type: 'danger',
                title: `Overbudget: ${b.category?.name}`,
                desc: `Pengeluaran telah melebihi batas anggaran (${b.percentage}%)`,
              });
            } else if (b.status === 'WARNING') {
              alerts.push({
                type: 'warning',
                title: `Mendekati Batas: ${b.category?.name}`,
                desc: `Pengeluaran telah mencapai ${b.percentage}% dari batas anggaran`,
              });
            }
          });
        }
        // Daily logging reminder
        alerts.push({
          type: 'info',
          title: 'Pengingat Harian',
          desc: 'Jangan lupa catat seluruh transaksi pengeluaran hari ini!',
        });
        setNotifications(alerts);
      })
      .catch(() => {});
  }, [session]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: Hamburger for mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Selamat datang, {session?.user?.name || 'Pengguna'} 👋
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Kelola arus kas & capai kebebasan finansial
          </p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add CTA */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>+ Transaksi</span>
        </button>

        {/* Currency Badge */}
        <div className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[11px] font-mono font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          {currency}
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Notifikasi & Pengingat
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 px-1.5 py-0.5 rounded font-mono">
                  {notifications.length}
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto p-2 space-y-1.5">
                {notifications.map((n, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl text-xs border ${
                      n.type === 'danger'
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                        : n.type === 'warning'
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300'
                        : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-0.5">
                      {n.type === 'danger' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {n.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {n.type === 'info' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{n.title}</span>
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {session?.user?.name || 'Alex Pratama'}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  {session?.user?.email || 'demo@fintrack.app'}
                </p>
              </div>

              <div className="p-1">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar (Sign Out)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
