import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
  const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10); // 1-12

  // Start & End of requested month
  const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  // Start & End of previous month
  const startOfPrevMonth = new Date(year, month - 2, 1, 0, 0, 0);
  const endOfPrevMonth = new Date(year, month - 1, 0, 23, 59, 59, 999);

  // Parallel data fetching
  const [
    wallets,
    currentMonthTx,
    prevMonthTx,
    recentTransactions,
    last6MonthsTx,
  ] = await Promise.all([
    // All Wallets
    prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    }),

    // Transactions in Current Month
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { category: true, wallet: true },
    }),

    // Transactions in Previous Month
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
      },
    }),

    // Recent 10 Transactions
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        category: true,
        wallet: true,
        destinationWallet: true,
      },
    }),

    // Last 6 Months for trend chart
    prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: new Date(year, month - 6, 1, 0, 0, 0),
          lte: endOfMonth,
        },
      },
    }),
  ]);

  // 1. Wallets & Total Balance
  const totalBalance = roundMoney(
    wallets.reduce((sum, w) => addMoney(sum, w.balance), 0)
  );

  // 2. Current Month Totals
  let incomeThisMonth = 0;
  let expenseThisMonth = 0;
  const categoryExpenseMap: Record<
    string,
    { name: string; color: string; icon: string; amount: number }
  > = {};

  for (const tx of currentMonthTx) {
    if (tx.type === 'INCOME') {
      incomeThisMonth = addMoney(incomeThisMonth, tx.amount);
    } else if (tx.type === 'EXPENSE') {
      expenseThisMonth = addMoney(expenseThisMonth, tx.amount);

      const catId = tx.categoryId || 'uncategorized';
      const catName = tx.category?.name || 'Lainnya';
      const catColor = tx.category?.color || '#94a3b8';
      const catIcon = tx.category?.icon || 'tag';

      if (!categoryExpenseMap[catId]) {
        categoryExpenseMap[catId] = {
          name: catName,
          color: catColor,
          icon: catIcon,
          amount: 0,
        };
      }
      categoryExpenseMap[catId].amount = addMoney(
        categoryExpenseMap[catId].amount,
        tx.amount
      );
    }
  }

  const netCashflowThisMonth = subtractMoney(incomeThisMonth, expenseThisMonth);

  // 3. Previous Month Totals
  let incomePrevMonth = 0;
  let expensePrevMonth = 0;
  for (const tx of prevMonthTx) {
    if (tx.type === 'INCOME') incomePrevMonth = addMoney(incomePrevMonth, tx.amount);
    if (tx.type === 'EXPENSE') expensePrevMonth = addMoney(expensePrevMonth, tx.amount);
  }

  // 4. Category Expenses Breakdown (Sorted by amount desc)
  const categoryExpenses = Object.entries(categoryExpenseMap)
    .map(([id, item]) => ({
      categoryId: id,
      name: item.name,
      color: item.color,
      icon: item.icon,
      amount: item.amount,
      percentage:
        expenseThisMonth > 0
          ? roundMoney((item.amount / expenseThisMonth) * 100)
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 5. 6-Month Monthly Trend
  const monthlyTrend: {
    key: string;
    label: string;
    income: number;
    expense: number;
    net: number;
  }[] = [];

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const label = `${monthNames[m]} ${y}`;
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;

    let mIncome = 0;
    let mExpense = 0;

    for (const tx of last6MonthsTx) {
      const txDate = new Date(tx.date);
      if (txDate.getMonth() === m && txDate.getFullYear() === y) {
        if (tx.type === 'INCOME') mIncome = addMoney(mIncome, tx.amount);
        if (tx.type === 'EXPENSE') mExpense = addMoney(mExpense, tx.amount);
      }
    }

    monthlyTrend.push({
      key,
      label,
      income: mIncome,
      expense: mExpense,
      net: subtractMoney(mIncome, mExpense),
    });
  }

  // 6. Savings Goals summary
  const savingsGoals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    period: { year, month },
    overview: {
      totalBalance,
      incomeThisMonth,
      expenseThisMonth,
      netCashflowThisMonth,
      incomePrevMonth,
      expensePrevMonth,
      savingsRate:
        incomeThisMonth > 0
          ? roundMoney((netCashflowThisMonth / incomeThisMonth) * 100)
          : 0,
    },
    categoryExpenses,
    monthlyTrend,
    recentTransactions,
    wallets,
    savingsGoals,
  });
}
