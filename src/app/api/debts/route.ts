import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { debtSchema } from '@/lib/validations';
import { roundMoney } from '@/lib/money';

// GET /api/debts — list all debts/receivables for the current user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // DEBT | RECEIVABLE | null (all)
  const status = searchParams.get('status'); // UNPAID | PARTIAL | PAID | null (all)

  const debts = await prisma.debt.findMany({
    where: {
      userId: (session.user as any).id,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      wallet: { select: { id: true, name: true, color: true, icon: true } },
      payments: { orderBy: { date: 'desc' } },
    },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  });

  // Enrich with computed fields
  const enriched = debts.map((d) => {
    const remaining = roundMoney(d.amount - d.paidAmount);
    const isOverdue =
      d.status !== 'PAID' && d.dueDate ? new Date(d.dueDate) < new Date() : false;
    return { ...d, remaining, isOverdue };
  });

  // Summary totals
  const totalDebt = enriched
    .filter((d) => d.type === 'DEBT' && d.status !== 'PAID')
    .reduce((s, d) => roundMoney(s + d.remaining), 0);
  const totalReceivable = enriched
    .filter((d) => d.type === 'RECEIVABLE' && d.status !== 'PAID')
    .reduce((s, d) => roundMoney(s + d.remaining), 0);

  return NextResponse.json({ debts: enriched, totalDebt, totalReceivable });
}

// POST /api/debts — create a new debt/receivable
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = debtSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { type, personName, amount, dueDate, borrowDate, description, walletId, notes } =
    parsed.data;

  const debt = await prisma.debt.create({
    data: {
      userId: (session.user as any).id,
      type,
      personName,
      amount: roundMoney(amount),
      paidAmount: 0,
      dueDate: dueDate ? new Date(dueDate) : null,
      borrowDate: borrowDate ? new Date(borrowDate) : new Date(),
      description: description || null,
      walletId: walletId || null,
      notes: notes || null,
      status: 'UNPAID',
    },
    include: { wallet: true, payments: true },
  });

  return NextResponse.json({ debt }, { status: 201 });
}
