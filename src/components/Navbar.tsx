'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
  Plus,
  X,
  RefreshCw,
  CheckCheck,
  HandCoins,
  Clock,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onOpenQuickAdd: () => void;
}

interface Notif {
  id: string;
  type: 'BUDGET_ALERT' | 'DEBT_DUE' | 'REMINDER' | 'SYSTEM' | 'CUSTOM';
  title: string;
  body: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

// ─── Add Reminder Modal ───────────────────────────────────────────────────────
function AddReminderModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle('');
      setBody('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return setError('Judul dan isi wajib diisi');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'CUSTOM', title: title.trim(), body: body.trim() }),
      });
      if (!res.ok) return setError('Gagal menyimpan pengingat');
      onSaved();
      onClose();
    } catch {
      setError('Kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <span className="font-bold text-sm text-gray-900 dark:text-white">
            Tambah Pengingat
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Judul
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              placeholder="cth. Bayar tagihan listrik"
              maxLength={120}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Isi Pengingat
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white resize-none"
              placeholder="cth. Jatuh tempo tanggal 10, cek PLN mobile"
              maxLength={500}
              rows={3}
              required
            />
          </div>
          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-60"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Notif Icon by Type ───────────────────────────────────────────────────────
function NotifIcon({ type }: { type: Notif['type'] }) {
  if (type === 'BUDGET_ALERT') return <AlertTriangle className="w-3.5 h-3.5" />;
  if (type === 'DEBT_DUE') return <HandCoins className="w-3.5 h-3.5" />;
  if (type === 'REMINDER') return <Clock className="w-3.5 h-3.5" />;
  if (type === 'SYSTEM') return <CheckCircle2 className="w-3.5 h-3.5" />;
  return <Info className="w-3.5 h-3.5" />;
}

function notifColors(type: Notif['type'], isRead: boolean) {
  const dim = isRead ? 'opacity-60' : '';
  if (type === 'BUDGET_ALERT')
    return `${dim} bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300`;
  if (type === 'DEBT_DUE')
    return `${dim} bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900/50 text-violet-800 dark:text-violet-300`;
  if (type === 'SYSTEM')
    return `${dim} bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300`;
  if (type === 'REMINDER')
    return `${dim} bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300`;
  return `${dim} bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300`;
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export function Navbar({ onToggleMobileSidebar, onOpenQuickAdd }: NavbarProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [currency, setCurrency] = useState('IDR');
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;
    setLoadingNotifs(true);
    try {
      const [notifRes, budgetRes] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/budgets'),
      ]);

      const notifData = await notifRes.json();
      const budgetData = await budgetRes.json();

      let dbNotifs: Notif[] = notifData.notifications ?? [];

      // Auto-inject unread budget alerts if not already in DB
      if (budgetData.budgets) {
        const autoAlerts: Omit<Notif, 'id' | 'createdAt'>[] = [];
        budgetData.budgets.forEach((b: any) => {
          if (b.status === 'OVERBUDGET') {
            autoAlerts.push({
              type: 'BUDGET_ALERT',
              title: `Overbudget: ${b.category?.name}`,
              body: `Pengeluaran melebihi batas anggaran bulan ini (${b.percentage}%)`,
              isRead: false,
              link: '/budgets',
            });
          } else if (b.status === 'WARNING') {
            autoAlerts.push({
              type: 'BUDGET_ALERT',
              title: `Mendekati Batas: ${b.category?.name}`,
              body: `Pengeluaran telah mencapai ${b.percentage}% dari batas anggaran`,
              isRead: false,
              link: '/budgets',
            });
          }
        });

        // Add inline as ephemeral items (not persisted, shown first)
        const ephemeral = autoAlerts.map((a, i) => ({
          ...a,
          id: `__ephemeral_${i}`,
          createdAt: new Date().toISOString(),
        }));
        dbNotifs = [...ephemeral, ...dbNotifs];
      }

      setNotifications(dbNotifs);
      setUnreadCount(dbNotifs.filter((n) => !n.isRead).length);
    } finally {
      setLoadingNotifs(false);
    }
  }, [session]);

  useEffect(() => {
    setMounted(true);
    if (session?.user) {
      setCurrency((session.user as any).currency || 'IDR');
      fetchNotifications();
    }
  }, [session, fetchNotifications]);

  // Poll every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user && showNotifications) fetchNotifications();
    }, 120_000);
    return () => clearInterval(interval);
  }, [session, showNotifications, fetchNotifications]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    fetchNotifications();
  };

  const deleteNotif = async (id: string) => {
    if (id.startsWith('__ephemeral_')) {
      // Remove ephemeral from local state only
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((c) => Math.max(0, c - 1));
      return;
    }
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    fetchNotifications();
  };

  const markRead = async (id: string) => {
    if (id.startsWith('__ephemeral_')) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      return;
    }
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: true }),
    });
    fetchNotifications();
  };

  const clearRead = async () => {
    await fetch('/api/notifications', { method: 'DELETE' });
    fetchNotifications();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <AddReminderModal
        open={showAddReminder}
        onClose={() => setShowAddReminder(false)}
        onSaved={fetchNotifications}
      />

      <header className="sticky top-0 z-30 h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
        {/* Left */}
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
              Kelola arus kas &amp; capai kebebasan finansial
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add */}
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

          {/* ─── Notification Bell (CRUD) ─── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Notif Header */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      Notifikasi
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-mono font-bold">
                        {unreadCount} baru
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={fetchNotifications}
                      disabled={loadingNotifs}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingNotifs ? 'animate-spin' : ''}`} />
                    </button>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        title="Tandai semua dibaca"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        setShowAddReminder(true);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      title="Tambah pengingat"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {notifications.filter((n) => n.isRead && !n.id.startsWith('__')).length > 0 && (
                      <button
                        onClick={clearRead}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Hapus yang sudah dibaca"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notif List */}
                <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400 space-y-2">
                      <Bell className="w-8 h-8 mx-auto text-gray-200 dark:text-gray-700" />
                      <p>Tidak ada notifikasi</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`group relative p-2.5 rounded-xl text-xs border transition-all ${notifColors(n.type, n.isRead)} cursor-pointer`}
                        onClick={() => !n.isRead && markRead(n.id)}
                      >
                        {/* Unread dot */}
                        {!n.isRead && (
                          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                        )}

                        <div className="flex items-start gap-1.5 pr-3">
                          <NotifIcon type={n.type} />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold mb-0.5 leading-snug">{n.title}</div>
                            <p className="text-[11px] opacity-90 leading-relaxed">{n.body}</p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[10px] opacity-60">
                                {new Date(n.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {n.link && !n.id.startsWith('__') && (
                                <a
                                  href={n.link}
                                  className="text-[10px] underline underline-offset-2 opacity-70 hover:opacity-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Lihat →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Delete button (hover) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotif(n.id);
                          }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                          title="Hapus"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      setShowAddReminder(true);
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    Tambah Pengingat
                  </button>
                  <span className="text-[10px] text-gray-400">
                    {notifications.length} notifikasi total
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
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
    </>
  );
}
