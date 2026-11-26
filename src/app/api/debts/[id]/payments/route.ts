import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { debtPaymentSchema } from '@/lib/validations';
import { roundMoney } from '@/lib/money';

type Params = { params: { id: string } };

// POST /api/debts/[id]/payments — record a repayment / cicilan
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const debt = await prisma.debt.findFirst({
    where: { id: params.id, userId: (session.user as any).id },
  });
  if (!debt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (debt.status === 'PAID') {
    return NextResponse.json({ error: 'Utang/piutang ini sudah lunas' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = debtPaymentSchema.safeParse({ ...body, debtId: params.id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const payAmount = roundMoney(parsed.data.amount);
  const remaining = roundMoney(debt.amount - debt.paidAmount);
  if (payAmount > remaining) {
    return NextResponse.json(
      { error: `Nominal cicilan (${payAmount}) melebihi sisa utang (${remaining})` },
      { status: 400 },
    );
  }

  const newPaid = roundMoney(debt.paidAmount + payAmount);
  const newStatus =
    newPaid >= roundMoney(debt.amount) ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'UNPAID';

  const [payment] = await prisma.$transaction([
    prisma.debtPayment.create({
      data: {
        debtId: params.id,
        amount: payAmount,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
        notes: parsed.data.notes || null,
      },
    }),
    prisma.debt.update({
      where: { id: params.id },
      data: { paidAmount: newPaid, status: newStatus },
    }),
  ]);

  // Auto-notify if fully paid
  if (newStatus === 'PAID') {
    await prisma.notification.create({
      data: {
        userId: (session.user as any).id,
        type: 'SYSTEM',
        title: debt.type === 'DEBT' ? '🎉 Utang Lunas!' : '🎉 Piutang Diterima!',
        body: `${debt.type === 'DEBT' ? 'Utang' : 'Piutang'} kepada ${debt.personName} sebesar nominal penuh telah diselesaikan.`,
        link: '/debts',
        metadata: JSON.stringify({ debtId: debt.id }),
      },
    });
  }

  return NextResponse.json({ payment, newStatus, newPaid }, { status: 201 });
}

// GET /api/debts/[id]/payments — list payments for a debt
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const debt = await prisma.debt.findFirst({
    where: { id: params.id, userId: (session.user as any).id },
  });
  if (!debt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const payments = await prisma.debtPayment.findMany({
    where: { debtId: params.id },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({ payments });
}
