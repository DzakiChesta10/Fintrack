import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { savingsGoalSchema } from '@/lib/validations';
import { roundMoney } from '@/lib/money';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  try {
    const body = await req.json();
    const validated = savingsGoalSchema.parse(body);

    const updated = await prisma.savingsGoal.update({
      where: { id: params.id, userId },
      data: {
        name: validated.name,
        targetAmount: roundMoney(validated.targetAmount),
        currentAmount: roundMoney(validated.currentAmount),
        targetDate: validated.targetDate ? new Date(validated.targetDate) : null,
        color: validated.color,
        icon: validated.icon,
        walletId: validated.walletId || null,
      },
      include: { wallet: true },
    });

    return NextResponse.json({ goal: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || 'Gagal memperbarui target tabungan' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const existing = await prisma.savingsGoal.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Target tidak ditemukan' }, { status: 404 });
  }

  await prisma.savingsGoal.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: 'Target tabungan berhasil dihapus' });
}
