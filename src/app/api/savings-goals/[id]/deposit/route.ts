import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { roundMoney, addMoney, subtractMoney } from '@/lib/money';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  try {
    const { amount, type = 'DEPOSIT', deductWallet = false, walletId } = await req.json();
    const parsedAmount = roundMoney(Math.abs(parseFloat(amount)));

    if (!parsedAmount || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Nominal tidak valid' }, { status: 400 });
    }

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: params.id, userId },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Target tidak ditemukan' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let newCurrentAmount = goal.currentAmount;

      if (type === 'DEPOSIT') {
        newCurrentAmount = addMoney(goal.currentAmount, parsedAmount);

        // If user wants to deduct this money from a real wallet
        if (deductWallet && walletId) {
          const wallet = await tx.wallet.findFirst({
            where: { id: walletId, userId },
          });
          if (wallet) {
            await tx.wallet.update({
              where: { id: walletId },
              data: { balance: subtractMoney(wallet.balance, parsedAmount) },
            });

            // Also create an informative transfer/expense record
            await tx.transaction.create({
              data: {
                userId,
                type: 'EXPENSE',
                amount: parsedAmount,
                date: new Date(),
                notes: `Alokasi Tabungan: ${goal.name}`,
                walletId,
              },
            });
          }
        }
      } else {
        // WITHDRAW
        newCurrentAmount = Math.max(0, subtractMoney(goal.currentAmount, parsedAmount));

        // If user wants to refund to wallet
        if (deductWallet && walletId) {
          const wallet = await tx.wallet.findFirst({
            where: { id: walletId, userId },
          });
          if (wallet) {
            await tx.wallet.update({
              where: { id: walletId },
              data: { balance: addMoney(wallet.balance, parsedAmount) },
            });

            await tx.transaction.create({
              data: {
                userId,
                type: 'INCOME',
                amount: parsedAmount,
                date: new Date(),
                notes: `Pencairan Tabungan: ${goal.name}`,
                walletId,
              },
            });
          }
        }
      }

      const updated = await tx.savingsGoal.update({
        where: { id: params.id },
        data: { currentAmount: newCurrentAmount },
      });

      return updated;
    });

    return NextResponse.json({
      message: `Berhasil ${type === 'DEPOSIT' ? 'menambah' : 'mencairkan'} dana tabungan`,
      goal: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memproses alokasi tabungan' },
      { status: 500 }
    );
  }
}
