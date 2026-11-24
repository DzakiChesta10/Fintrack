import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recurringSchema } from '@/lib/validations';
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

    // If just toggling isActive
    if (typeof body.isActive === 'boolean' && Object.keys(body).length === 1) {
      const updated = await prisma.recurringTransaction.update({
        where: { id: params.id, userId },
        data: { isActive: body.isActive },
      });
      return NextResponse.json({ recurring: updated });
    }

    const validated = recurringSchema.parse(body);
    const amount = roundMoney(validated.amount);
    const startDate = new Date(validated.startDate);

    const updated = await prisma.recurringTransaction.update({
      where: { id: params.id, userId },
      data: {
        name: validated.name,
        type: validated.type,
        amount,
        frequency: validated.frequency,
        startDate,
        notes: validated.notes || null,
        walletId: validated.walletId,
        destinationWalletId:
          validated.type === 'TRANSFER' ? validated.destinationWalletId : null,
        categoryId:
          validated.type !== 'TRANSFER' ? validated.categoryId : null,
      },
    });

    return NextResponse.json({ recurring: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || 'Gagal memperbarui transaksi rutin' },
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
  const existing = await prisma.recurringTransaction.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
  }

  await prisma.recurringTransaction.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: 'Transaksi rutin berhasil dihapus' });
}
