import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { roundMoney, addMoney, subtractMoney } from '@/lib/money';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  try {
    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Data impor tidak boleh kosong' },
        { status: 400 }
      );
    }

    const [wallets, categories] = await Promise.all([
      prisma.wallet.findMany({ where: { userId } }),
      prisma.category.findMany({ where: { userId } }),
    ]);

    if (wallets.length === 0) {
      return NextResponse.json(
        { error: 'Harap buat minimal satu dompet terlebih dahulu sebelum impor transaksi' },
        { status: 400 }
      );
    }

    const defaultWallet = wallets[0];

    let successCount = 0;
    const errors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < items.length; i++) {
        const row = items[i];
        const rowNum = i + 1;

        const rawAmount = parseFloat(String(row.amount || '').replace(/[^0-9.]/g, ''));
        if (isNaN(rawAmount) || rawAmount <= 0) {
          errors.push(`Baris ${rowNum}: Nominal tidak valid (${row.amount})`);
          continue;
        }

        const amount = roundMoney(rawAmount);

        // Normalize type
        let type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE';
        const rawType = String(row.type || '').toUpperCase();
        if (rawType.includes('INCOME') || rawType.includes('PEMASUKAN') || rawType.includes('MASUK') || rawType.includes('CR')) {
          type = 'INCOME';
        } else if (rawType.includes('TRANSFER') || rawType.includes('PINDAH')) {
          type = 'TRANSFER';
        }

        // Match wallet
        let targetWallet = defaultWallet;
        if (row.wallet) {
          const matched = wallets.find((w) =>
            w.name.toLowerCase().includes(String(row.wallet).toLowerCase())
          );
          if (matched) targetWallet = matched;
        }

        // Match category
        let categoryId: string | null = null;
        if (row.category && type !== 'TRANSFER') {
          const matchedCat = categories.find((c) =>
            c.name.toLowerCase().includes(String(row.category).toLowerCase())
          );
          if (matchedCat) {
            categoryId = matchedCat.id;
          }
        }

        // Fallback category if none matched
        if (!categoryId && type !== 'TRANSFER') {
          const fallback = categories.find((c) => c.type === type);
          if (fallback) categoryId = fallback.id;
        }

        // Parse date
        let txDate = new Date();
        if (row.date) {
          const parsedD = new Date(row.date);
          if (!isNaN(parsedD.getTime())) txDate = parsedD;
        }

        // Adjust wallet
        if (type === 'INCOME') {
          await tx.wallet.update({
            where: { id: targetWallet.id },
            data: { balance: addMoney(targetWallet.balance, amount) },
          });
        } else if (type === 'EXPENSE') {
          await tx.wallet.update({
            where: { id: targetWallet.id },
            data: { balance: subtractMoney(targetWallet.balance, amount) },
          });
        }

        // Create transaction
        await tx.transaction.create({
          data: {
            userId,
            type,
            amount,
            date: txDate,
            notes: row.notes ? String(row.notes).slice(0, 255) : 'Impor Transaksi',
            walletId: targetWallet.id,
            categoryId,
          },
        });

        successCount++;
      }
    });

    return NextResponse.json({
      message: `Berhasil mengimpor ${successCount} transaksi`,
      successCount,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memproses impor transaksi' },
      { status: 500 }
    );
  }
}
