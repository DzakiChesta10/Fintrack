import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { savingsGoalSchema } from '@/lib/validations';
import { roundMoney, subtractMoney } from '@/lib/money';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    include: { wallet: true },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const enriched = goals.map((g) => {
    const percentage =
      g.targetAmount > 0
        ? Math.min(100, roundMoney((g.currentAmount / g.targetAmount) * 100))
        : 0;
    const remaining = Math.max(0, subtractMoney(g.targetAmount, g.currentAmount));

    let daysLeft: number | null = null;
    if (g.targetDate) {
      const diffTime = new Date(g.targetDate).getTime() - now.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      ...g,
      percentage,
      remaining,
      daysLeft,
      isAchieved: g.currentAmount >= g.targetAmount,
    };
  });

  return NextResponse.json({ goals: enriched });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  try {
    const body = await req.json();
    const validated = savingsGoalSchema.parse(body);

    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name: validated.name,
        targetAmount: roundMoney(validated.targetAmount),
        currentAmount: roundMoney(validated.currentAmount || 0),
        targetDate: validated.targetDate ? new Date(validated.targetDate) : null,
        color: validated.color,
        icon: validated.icon,
        walletId: validated.walletId || null,
      },
      include: { wallet: true },
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || 'Gagal menyimpan target tabungan' },
      { status: 400 }
    );
  }
}
