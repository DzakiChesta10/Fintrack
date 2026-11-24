import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SessionProvider } from '@/components/SessionProvider';
import { PinLockModal } from '@/components/PinLockModal';

export const metadata: Metadata = {
  title: 'FinTrack Pro | Personal Income & Outcome Tracker',
  description:
    'Aplikasi pencatat keuangan pribadi modern dengan Next.js App Router, multi-wallet, budgeting, OCR struk belanja, split bill, dan analisis portofolio.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white">
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <PinLockModal />
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
