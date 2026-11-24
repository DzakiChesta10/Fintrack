import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { splitBillSchema } from '@/lib/validations';
import { roundMoney, subtractMoney } from '@/lib/money';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const splitBills = await prisma.splitBill.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ splitBills });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  try {
    const body = await req.json();
    const validated = splitBillSchema.parse(body);

    const { saveAsExpense, walletId, categoryId } = body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create SplitBill record
      const bill = await tx.splitBill.create({
        data: {
          userId,
          title: validated.title,
          totalAmount: roundMoney(validated.totalAmount),
          myShare: roundMoney(validated.myShare),
          participantsCount: validated.participantsCount,
          status: validated.status || 'SETTLED',
          details: validated.details || null,
        },
      });

      // 2. If user requested to immediately record their personal share into transactions
      if (saveAsExpense && walletId) {
        const wallet = await tx.wallet.findFirst({
          where: { id: walletId, userId },
        });

        if (wallet) {
          // Deduct from wallet
          await tx.wallet.update({
            where: { id: walletId },
            data: {
              balance: subtractMoney(wallet.balance, validated.myShare),
            },
          });

          // Create transaction for myShare only!
          await tx.transaction.create({
            data: {
              userId,
              type: 'EXPENSE',
              amount: roundMoney(validated.myShare),
              date: new Date(),
              notes: `[Split Bill] ${validated.title} (Porsi Saya)`,
              walletId,
              categoryId: categoryId || null,
            },
          });
        }
      }

      return bill;
    });

    return NextResponse.json({ splitBill: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || error?.message || 'Gagal menyimpan kalkulasi patungan' },
      { status: 400 }
    );
  }
}
