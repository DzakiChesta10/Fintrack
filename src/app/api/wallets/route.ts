import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { walletSchema } from '@/lib/validations';
import { roundMoney } from '@/lib/money';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  const totalBalance = roundMoney(
    wallets.reduce((sum, w) => sum + w.balance, 0)
  );

  return NextResponse.json({
    wallets,
    totalBalance,
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
    const validated = walletSchema.parse(body);

    const wallet = await prisma.wallet.create({
      data: {
        userId,
        name: validated.name,
        type: validated.type,
        balance: roundMoney(validated.balance),
        color: validated.color,
        icon: validated.icon,
      },
    });

    return NextResponse.json({ wallet }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || 'Gagal membuat dompet' },
      { status: 400 }
    );
  }
}
