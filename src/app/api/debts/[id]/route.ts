import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { debtSchema } from '@/lib/validations';
import { roundMoney } from '@/lib/money';

type Params = { params: { id: string } };

function computeStatus(amount: number, paidAmount: number): string {
  const paid = roundMoney(paidAmount);
  if (paid <= 0) return 'UNPAID';
  if (paid >= roundMoney(amount)) return 'PAID';
  return 'PARTIAL';
}

// GET /api/debts/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const debt = await prisma.debt.findFirst({
    where: { id: params.id, userId: (session.user as any).id },
    include: {
      wallet: { select: { id: true, name: true, color: true, icon: true } },
      payments: { orderBy: { date: 'desc' } },
    },
  });
  if (!debt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    debt: {
      ...debt,
      remaining: roundMoney(debt.amount - debt.paidAmount),
      isOverdue: debt.status !== 'PAID' && debt.dueDate ? new Date(debt.dueDate) < new Date() : false,
    },
  });
}

// PATCH /api/debts/[id] — update debt details
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.debt.findFirst({
    where: { id: params.id, userId: (session.user as any).id },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const parsed = debtSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updated = await prisma.debt.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.type !== undefined && { type: parsed.data.type }),
      ...(parsed.data.personName !== undefined && { personName: parsed.data.personName }),
      ...(parsed.data.amount !== undefined && { amount: roundMoney(parsed.data.amount) }),
      ...(parsed.data.dueDate !== undefined && {
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      }),
      ...(parsed.data.borrowDate !== undefined && {
        borrowDate: parsed.data.borrowDate ? new Date(parsed.data.borrowDate) : new Date(),
      }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.walletId !== undefined && { walletId: parsed.data.walletId }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
    include: { wallet: true, payments: true },
  });

  return NextResponse.json({ debt: updated });
}

// DELETE /api/debts/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.debt.findFirst({
    where: { id: params.id, userId: (session.user as any).id },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.debt.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
