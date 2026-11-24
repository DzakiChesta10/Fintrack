import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { categorySchema } from '@/lib/validations';

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
    const validated = categorySchema.parse(body);

    const existing = await prisma.category.findFirst({
      where: { id: params.id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: validated.name,
        type: validated.type,
        color: validated.color,
        icon: validated.icon,
      },
    });

    return NextResponse.json({ category: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || 'Gagal memperbarui kategori' },
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
  const existing = await prisma.category.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
  }

  // Count transactions
  const txCount = await prisma.transaction.count({
    where: { categoryId: params.id },
  });

  if (txCount > 0) {
    return NextResponse.json(
      {
        error: `Kategori tidak dapat dihapus karena digunakan pada ${txCount} transaksi.`,
      },
      { status: 400 }
    );
  }

  await prisma.category.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: 'Kategori berhasil dihapus' });
}
