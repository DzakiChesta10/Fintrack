import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addMoney, subtractMoney } from '@/lib/money';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  try {
    const { id } = await req.json();

    const recurring = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
      include: { wallet: true, destinationWallet: true },
    });

    if (!recurring) {
      return NextResponse.json(
        { error: 'Transaksi rutin tidak ditemukan' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Run transaction execution atomically
    const newTransaction = await prisma.$transaction(async (tx) => {
      // 1. Update source wallet balance
      if (recurring.type === 'INCOME') {
        await tx.wallet.update({
          where: { id: recurring.walletId },
          data: { balance: addMoney(recurring.wallet.balance, recurring.amount) },
        });
      } else if (recurring.type === 'EXPENSE') {
        await tx.wallet.update({
          where: { id: recurring.walletId },
          data: { balance: subtractMoney(recurring.wallet.balance, recurring.amount) },
        });
      } else if (recurring.type === 'TRANSFER' && recurring.destinationWalletId) {
        const destWallet = await tx.wallet.findUnique({
          where: { id: recurring.destinationWalletId },
        });
        if (destWallet) {
          await tx.wallet.update({
            where: { id: recurring.walletId },
            data: { balance: subtractMoney(recurring.wallet.balance, recurring.amount) },
          });
          await tx.wallet.update({
            where: { id: recurring.destinationWalletId },
            data: { balance: addMoney(destWallet.balance, recurring.amount) },
          });
        }
      }

      // 2. Create the transaction record
      const createdTx = await tx.transaction.create({
        data: {
          userId,
          type: recurring.type,
          amount: recurring.amount,
          date: now,
          notes: `[Rutin: ${recurring.name}] ${recurring.notes || ''}`.trim(),
          isRecurring: true,
          walletId: recurring.walletId,
          destinationWalletId: recurring.destinationWalletId,
          categoryId: recurring.categoryId,
        },
        include: {
          category: true,
          wallet: true,
          destinationWallet: true,
        },
      });

      // 3. Compute next run date
      const nextDate = new Date(recurring.nextRunDate);
      if (recurring.frequency === 'DAILY') {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (recurring.frequency === 'WEEKLY') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (recurring.frequency === 'MONTHLY') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (recurring.frequency === 'YEARLY') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      await tx.recurringTransaction.update({
        where: { id: recurring.id },
        data: {
          lastRunDate: now,
          nextRunDate: nextDate,
        },
      });

      return createdTx;
    });

    return NextResponse.json({
      message: `Berhasil mengeksekusi transaksi rutin "${recurring.name}"`,
      transaction: newTransaction,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal mengeksekusi transaksi rutin' },
      { status: 500 }
    );
  }
}
