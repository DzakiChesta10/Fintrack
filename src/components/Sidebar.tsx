'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Tags,
  PieChart,
  Repeat,
  Target,
  Users,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Camera,
  Coins,
  ChevronRight,
  TrendingUp,
  HandCoins,
} from 'lucide-react';

interface SidebarProps {
  onOpenQuickAdd?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ onOpenQuickAdd, isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Transaksi', href: '/transactions', icon: Receipt },
    { name: 'Dompet & Akun', href: '/wallets', icon: Wallet },
    { name: 'Kategori', href: '/categories', icon: Tags },
    { name: 'Anggaran Bulanan', href: '/budgets', icon: PieChart },
    { name: 'Transaksi Rutin', href: '/recurring', icon: Repeat },
    { name: 'Target Tabungan', href: '/goals', icon: Target },
    { name: 'Utang & Piutang', href: '/debts', icon: HandCoins, badge: 'Baru' },
    { name: 'Split Bill (Patungan)', href: '/split-bill', icon: Users, badge: 'Inovasi' },
    { name: 'Laporan & Tren', href: '/analytics', icon: BarChart3 },
    { name: 'Impor & Ekspor', href: '/import-export', icon: FileSpreadsheet },
    { name: 'Pengaturan', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-800 gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              FinTrack Pro
            </span>
            <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              Wealth Management
            </span>
          </div>
        </div>

        {/* Quick Add Button */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800/50">
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              if (onOpenQuickAdd) onOpenQuickAdd();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium text-sm transition-all shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            + Catat Cepat (AI / Form)
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center justify-between">
            <span>Portfolio Edition</span>
            <span className="font-mono text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              v1.0.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
