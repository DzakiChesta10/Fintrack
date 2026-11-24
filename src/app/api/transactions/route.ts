import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { transactionSchema } from '@/lib/validations';
import { roundMoney, addMoney, subtractMoney } from '@/lib/money';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);

  const type = searchParams.get('type');
  const categoryId = searchParams.get('categoryId');
  const walletId = searchParams.get('walletId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const skip = (page - 1) * limit;

  const where: any = { userId };

  if (type && ['INCOME', 'EXPENSE', 'TRANSFER'].includes(type)) {
    where.type = type;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (walletId) {
    where.OR = [
      { walletId: walletId },
      { destinationWalletId: walletId },
    ];
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date.lte = end;
    }
  }

  if (search) {
    const searchFilter = {
      contains: search,
    };
    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        {
          OR: [
            { notes: searchFilter },
            { category: { name: searchFilter } },
            { wallet: { name: searchFilter } },
          ],
        },
      ];
      delete where.OR;
    } else {
      where.OR = [
        { notes: searchFilter },
        { category: { name: searchFilter } },
        { wallet: { name: searchFilter } },
      ];
    }
  }

  const [totalCount, transactions, allTransactionsInScope] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit,
      include: {
        category: true,
        wallet: true,
        destinationWallet: true,
      },
    }),
    prisma.transaction.findMany({
      where,
      select: { type: true, amount: true },
    }),
  ]);

  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of allTransactionsInScope) {
    if (tx.type === 'INCOME') {
      totalIncome = addMoney(totalIncome, tx.amount);
    } else if (tx.type === 'EXPENSE') {
      totalExpense = addMoney(totalExpense, tx.amount);
    }
  }

  const netCashflow = subtractMoney(totalIncome, totalExpense);

  return NextResponse.json({
    transactions,
    pagination: {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
    summary: {
      totalIncome,
      totalExpense,
      netCashflow,
    },
  });
}

export async function POST(req: Request) {
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

    // Run in atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify wallet ownership
      const sourceWallet = await tx.wallet.findFirst({
        where: { id: validated.walletId, userId },
      });
      if (!sourceWallet) {
        throw new Error('Dompet sumber tidak ditemukan');
      }

      // 2. Adjust wallet balances
      if (validated.type === 'INCOME') {
        await tx.wallet.update({
          where: { id: validated.walletId },
          data: { balance: addMoney(sourceWallet.balance, amount) },
        });
      } else if (validated.type === 'EXPENSE') {
        await tx.wallet.update({
          where: { id: validated.walletId },
          data: { balance: subtractMoney(sourceWallet.balance, amount) },
        });
      } else if (validated.type === 'TRANSFER') {
        if (!validated.destinationWalletId) {
          throw new Error('Dompet tujuan wajib diisi untuk transfer');
        }
        const destWallet = await tx.wallet.findFirst({
          where: { id: validated.destinationWalletId, userId },
        });
        if (!destWallet) {
          throw new Error('Dompet tujuan tidak ditemukan');
        }

        // Deduct from source
        await tx.wallet.update({
          where: { id: validated.walletId },
          data: { balance: subtractMoney(sourceWallet.balance, amount) },
        });
        // Add to destination
        await tx.wallet.update({
          where: { id: validated.destinationWalletId },
          data: { balance: addMoney(destWallet.balance, amount) },
        });
      }

      // 3. Create transaction record
      const createdTx = await tx.transaction.create({
        data: {
          userId,
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

      return createdTx;
    });

    return NextResponse.json({ transaction: result }, { status: 201 });
  } catch (error: any) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: error?.message || error?.errors?.[0]?.message || 'Gagal menyimpan transaksi' },
      { status: 400 }
    );
  }
}
