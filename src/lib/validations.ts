import { z } from 'zod';

export const transactionSchema = z
  .object({
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    amount: z.number().positive('Nominal harus lebih dari 0'),
    date: z.union([z.string(), z.date()]),
    walletId: z.string().min(1, 'Pilih dompet/akun'),
    destinationWalletId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    notes: z.string().max(255, 'Catatan maksimal 255 karakter').optional().nullable(),
    receiptUrl: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.type === 'TRANSFER') {
        return !!data.destinationWalletId && data.walletId !== data.destinationWalletId;
      }
      return true;
    },
    {
      message: 'Transfer memerlukan dompet tujuan yang berbeda dari dompet sumber',
      path: ['destinationWalletId'],
    }
  )
  .refine(
    (data) => {
      if (data.type !== 'TRANSFER') {
        return !!data.categoryId;
      }
      return true;
    },
    {
      message: 'Kategori harus dipilih untuk Pemasukan atau Pengeluaran',
      path: ['categoryId'],
    }
  );

export const walletSchema = z.object({
  name: z.string().min(2, 'Nama dompet minimal 2 karakter').max(50),
  type: z.enum(['CASH', 'BANK', 'E_WALLET', 'INVESTMENT', 'CREDIT_CARD', 'OTHER']),
  balance: z.number(),
  color: z.string().default('#3b82f6'),
  icon: z.string().default('wallet'),
});

export const categorySchema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter').max(50),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().default('#64748b'),
  icon: z.string().default('tag'),
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Pilih kategori anggaran'),
  amount: z.number().positive('Batas anggaran harus lebih dari 0'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2050),
  alertThreshold: z.number().min(0.1).max(1).default(0.8),
});

export const recurringSchema = z
  .object({
    name: z.string().min(2, 'Nama transaksi rutin minimal 2 karakter'),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    amount: z.number().positive('Nominal harus lebih dari 0'),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    startDate: z.union([z.string(), z.date()]),
    walletId: z.string().min(1, 'Pilih dompet sumber'),
    destinationWalletId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    notes: z.string().max(255).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.type === 'TRANSFER') {
        return !!data.destinationWalletId && data.walletId !== data.destinationWalletId;
      }
      return true;
    },
    {
      message: 'Transfer memerlukan dompet tujuan yang berbeda',
      path: ['destinationWalletId'],
    }
  );

export const savingsGoalSchema = z.object({
  name: z.string().min(2, 'Nama target tabungan minimal 2 karakter'),
  targetAmount: z.number().positive('Target dana harus lebih dari 0'),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.union([z.string(), z.date()]).optional().nullable(),
  color: z.string().default('#10b981'),
  icon: z.string().default('target'),
  walletId: z.string().optional().nullable(),
});

export const splitBillSchema = z.object({
  title: z.string().min(2, 'Judul patungan minimal 2 karakter'),
  totalAmount: z.number().positive('Total tagihan harus lebih dari 0'),
  myShare: z.number().positive('Porsi pribadi harus lebih dari 0'),
  participantsCount: z.number().int().min(2, 'Minimal 2 orang peserta'),
  status: z.enum(['SETTLED', 'PENDING']).default('SETTLED'),
  details: z.string().optional().nullable(),
});

export const userSettingsSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  currency: z.enum(['IDR', 'USD', 'SGD']),
  pinCode: z.string().regex(/^\d{4,6}$/, 'PIN harus berupa 4-6 digit angka').optional().nullable(),
});

// ─── Utang & Piutang ──────────────────────────────────────────────────────────
export const debtSchema = z.object({
  type: z.enum(['DEBT', 'RECEIVABLE']),
  personName: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  amount: z.number().positive('Nominal harus lebih dari 0'),
  dueDate: z.union([z.string(), z.date()]).optional().nullable(),
  borrowDate: z.union([z.string(), z.date()]).optional(),
  description: z.string().max(255).optional().nullable(),
  walletId: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const debtPaymentSchema = z.object({
  debtId: z.string().min(1),
  amount: z.number().positive('Nominal cicilan harus lebih dari 0'),
  date: z.union([z.string(), z.date()]).optional(),
  notes: z.string().max(255).optional().nullable(),
});

// ─── Notifikasi ───────────────────────────────────────────────────────────────
export const notificationSchema = z.object({
  type: z.enum(['BUDGET_ALERT', 'DEBT_DUE', 'REMINDER', 'SYSTEM', 'CUSTOM']).default('CUSTOM'),
  title: z.string().min(2, 'Judul notifikasi minimal 2 karakter').max(120),
  body: z.string().min(2, 'Isi notifikasi minimal 2 karakter').max(500),
  link: z.string().url('Link harus berupa URL valid').optional().nullable(),
  metadata: z.string().optional().nullable(),
});
