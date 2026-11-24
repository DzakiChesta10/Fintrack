import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recurringSchema } from '@/lib/validations';
import { roundMoney } from '@/lib/money';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const recurring = await prisma.recurringTransaction.findMany({
    where: { userId },
    orderBy: { nextRunDate: 'asc' },
    include: {
      category: true,
      wallet: true,
      destinationWallet: true,
    },
  });

  return NextResponse.json({ recurring });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  try {
    const body = await req.json();
    const validated = recurringSchema.parse(body);

    const amount = roundMoney(validated.amount);
    const startDate = new Date(validated.startDate);

    // Calculate initial nextRunDate
    let nextRunDate = new Date(startDate);
    const now = new Date();
    if (nextRunDate < now) {
      // Advance to next period
      if (validated.frequency === 'DAILY') {
        nextRunDate.setDate(now.getDate() + 1);
      } else if (validated.frequency === 'WEEKLY') {
        nextRunDate.setDate(now.getDate() + 7);
      } else if (validated.frequency === 'MONTHLY') {
        nextRunDate.setMonth(now.getMonth() + 1);
      } else if (validated.frequency === 'YEARLY') {
        nextRunDate.setFullYear(now.getFullYear() + 1);
      }
    }

    const created = await prisma.recurringTransaction.create({
      data: {
        userId,
        name: validated.name,
        type: validated.type,
        amount,
        frequency: validated.frequency,
        startDate,
        nextRunDate,
        notes: validated.notes || null,
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

    return NextResponse.json({ recurring: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || 'Gagal menyimpan transaksi rutin' },
      { status: 400 }
    );
  }
}
