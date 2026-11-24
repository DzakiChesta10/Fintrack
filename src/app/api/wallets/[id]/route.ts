import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { walletSchema } from '@/lib/validations';
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
    const validated = walletSchema.parse(body);

    const existing = await prisma.wallet.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dompet tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.wallet.update({
      where: { id: params.id },
      data: {
        name: validated.name,
        type: validated.type,
        balance: roundMoney(validated.balance),
        color: validated.color,
        icon: validated.icon,
      },
    });

    return NextResponse.json({ wallet: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || 'Gagal memperbarui dompet' },
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
  const existing = await prisma.wallet.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Dompet tidak ditemukan' }, { status: 404 });
  }

  // Count associated transactions
  const txCount = await prisma.transaction.count({
    where: {
      OR: [{ walletId: params.id }, { destinationWalletId: params.id }],
    },
  });

  if (txCount > 0) {
    return NextResponse.json(
      {
        error: `Dompet tidak dapat dihapus karena memiliki ${txCount} riwayat transaksi. Harap pindahkan atau hapus transaksi terlebih dahulu.`,
      },
      { status: 400 }
    );
  }

  await prisma.wallet.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: 'Dompet berhasil dihapus' });
}
