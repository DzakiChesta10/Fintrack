import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { transactionSchema } from '@/lib/validations';
import { roundMoney, addMoney, subtractMoney } from '@/lib/money';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const transaction = await prisma.transaction.findFirst({
    where: { id: params.id, userId },
    include: {
      category: true,
      wallet: true,
      destinationWallet: true,
    },
  });

  if (!transaction) {
    return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ transaction });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  try {
    const body = await req.json();
    const validated = transactionSchema.parse(body);

    const amount = roundMoney(validated.amount);
    const date = new Date(validated.date);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find existing transaction
      const existing = await tx.transaction.findFirst({
        where: { id: params.id, userId },
      });

      if (!existing) {
        throw new Error('Transaksi tidak ditemukan');
      }

      // 2. Revert previous wallet balance impact
      if (existing.type === 'INCOME') {
        const w = await tx.wallet.findUnique({ where: { id: existing.walletId } });
        if (w) {
          await tx.wallet.update({
            where: { id: existing.walletId },
            data: { balance: subtractMoney(w.balance, existing.amount) },
          });
        }
      } else if (existing.type === 'EXPENSE') {
        const w = await tx.wallet.findUnique({ where: { id: existing.walletId } });
        if (w) {
          await tx.wallet.update({
            where: { id: existing.walletId },
            data: { balance: addMoney(w.balance, existing.amount) },
          });
        }
      } else if (existing.type === 'TRANSFER') {
        const src = await tx.wallet.findUnique({ where: { id: existing.walletId } });
        if (src) {
          await tx.wallet.update({
            where: { id: existing.walletId },
            data: { balance: addMoney(src.balance, existing.amount) },
          });
        }
        if (existing.destinationWalletId) {
          const dst = await tx.wallet.findUnique({
            where: { id: existing.destinationWalletId },
          });
          if (dst) {
            await tx.wallet.update({
              where: { id: existing.destinationWalletId },
              data: { balance: subtractMoney(dst.balance, existing.amount) },
            });
          }
        }
      }

      // 3. Apply new wallet balance impact
      const newSourceWallet = await tx.wallet.findFirst({
        where: { id: validated.walletId, userId },
      });
      if (!newSourceWallet) {
        throw new Error('Dompet sumber tidak ditemukan');
      }

      if (validated.type === 'INCOME') {
        await tx.wallet.update({
          where: { id: validated.walletId },
          data: { balance: addMoney(newSourceWallet.balance, amount) },
        });
      } else if (validated.type === 'EXPENSE') {
        await tx.wallet.update({
          where: { id: validated.walletId },
          data: { balance: subtractMoney(newSourceWallet.balance, amount) },
        });
      } else if (validated.type === 'TRANSFER') {
        if (!validated.destinationWalletId) {
          throw new Error('Dompet tujuan wajib diisi untuk transfer');
        }
        const newDestWallet = await tx.wallet.findFirst({
          where: { id: validated.destinationWalletId, userId },
        });
        if (!newDestWallet) {
          throw new Error('Dompet tujuan tidak ditemukan');
        }

        await tx.wallet.update({
          where: { id: validated.walletId },
          data: { balance: subtractMoney(newSourceWallet.balance, amount) },
        });
        await tx.wallet.update({
          where: { id: validated.destinationWalletId },
          data: { balance: addMoney(newDestWallet.balance, amount) },
        });
      }

      // 4. Update transaction
      const updatedTx = await tx.transaction.update({
        where: { id: params.id },
        data: {
          type: validated.type,
          amount,
          date,
          notes: validated.notes || null,
          receiptUrl: validated.receiptUrl || null,
          walletId: validated.walletId,
          destinationWalletId:
            validated.type === 'TRANSFER' ? validated.destinationWalletId : null,
          categoryId:
            validated.type !== 'TRANSFER' ? validated.categoryId : null,
        },
        include: {
          category: true,
          wallet: true,
          destinationWallet: true,
        },
      });

      return updatedTx;
    });

    return NextResponse.json({ transaction: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui transaksi' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: { id: params.id, userId },
      });

      if (!existing) {
        throw new Error('Transaksi tidak ditemukan');
      }

      // Revert wallet balance
      if (existing.type === 'INCOME') {
        const w = await tx.wallet.findUnique({ where: { id: existing.walletId } });
        if (w) {
          await tx.wallet.update({
            where: { id: existing.walletId },
            data: { balance: subtractMoney(w.balance, existing.amount) },
          });
        }
      } else if (existing.type === 'EXPENSE') {
        const w = await tx.wallet.findUnique({ where: { id: existing.walletId } });
        if (w) {
          await tx.wallet.update({
            where: { id: existing.walletId },
            data: { balance: addMoney(w.balance, existing.amount) },
          });
        }
      } else if (existing.type === 'TRANSFER') {
        const src = await tx.wallet.findUnique({ where: { id: existing.walletId } });
        if (src) {
          await tx.wallet.update({
            where: { id: existing.walletId },
            data: { balance: addMoney(src.balance, existing.amount) },
          });
        }
        if (existing.destinationWalletId) {
          const dst = await tx.wallet.findUnique({
            where: { id: existing.destinationWalletId },
          });
          if (dst) {
            await tx.wallet.update({
              where: { id: existing.destinationWalletId },
              data: { balance: subtractMoney(dst.balance, existing.amount) },
            });
          }
        }
      }

      // Delete record
      await tx.transaction.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ message: 'Transaksi berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus transaksi' },
      { status: 400 }
    );
  }
}
