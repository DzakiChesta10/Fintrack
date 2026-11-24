import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { budgetSchema } from '@/lib/validations';
import { roundMoney, addMoney, subtractMoney } from '@/lib/money';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);

  const now = new Date();
  const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);
  const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);

  const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  // Fetch budgets and actual expense transactions for this month
  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
      orderBy: { amount: 'desc' },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfMonth, lte: endOfMonth },
        categoryId: { not: null },
      },
      select: { categoryId: true, amount: true },
    }),
  ]);

  // Aggregate spent per category
  const spentMap: Record<string, number> = {};
  for (const exp of expenses) {
    if (exp.categoryId) {
      spentMap[exp.categoryId] = addMoney(
        spentMap[exp.categoryId] || 0,
        exp.amount
      );
    }
  }

  // Calculate progress and status
  let totalBudget = 0;
  let totalSpent = 0;

  const budgetItems = budgets.map((b) => {
    const spent = spentMap[b.categoryId] || 0;
    const remaining = subtractMoney(b.amount, spent);
    const percentage = b.amount > 0 ? roundMoney((spent / b.amount) * 100) : 0;

    totalBudget = addMoney(totalBudget, b.amount);
    totalSpent = addMoney(totalSpent, spent);

    let status: 'SAFE' | 'WARNING' | 'OVERBUDGET' = 'SAFE';
    if (spent > b.amount) {
      status = 'OVERBUDGET';
    } else if (spent >= b.amount * b.alertThreshold) {
      status = 'WARNING';
    }

    return {
      ...b,
      spent,
      remaining,
      percentage,
      status,
    };
  });

  return NextResponse.json({
    budgets: budgetItems,
    summary: {
      totalBudget,
      totalSpent,
      totalRemaining: subtractMoney(totalBudget, totalSpent),
      overallPercentage:
        totalBudget > 0 ? roundMoney((totalSpent / totalBudget) * 100) : 0,
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
    const validated = budgetSchema.parse(body);

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: validated.categoryId,
          month: validated.month,
          year: validated.year,
        },
      },
      create: {
        userId,
        categoryId: validated.categoryId,
        amount: roundMoney(validated.amount),
        month: validated.month,
        year: validated.year,
        alertThreshold: validated.alertThreshold,
      },
      update: {
        amount: roundMoney(validated.amount),
        alertThreshold: validated.alertThreshold,
      },
      include: { category: true },
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || 'Gagal menyimpan anggaran' },
      { status: 400 }
    );
  }
}
