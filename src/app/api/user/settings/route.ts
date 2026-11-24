import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { userSettingsSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      currency: true,
      pinCode: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      hasPin: !!user.pinCode,
      createdAt: user.createdAt,
    },
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  try {
    const body = await req.json();
    const validated = userSettingsSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: validated.name,
        currency: validated.currency,
        ...(validated.pinCode !== undefined
          ? { pinCode: validated.pinCode || null }
          : {}),
      },
    });

    return NextResponse.json({
      message: 'Pengaturan berhasil disimpan',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        currency: updated.currency,
        hasPin: !!updated.pinCode,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.errors?.[0]?.message || 'Gagal menyimpan pengaturan' },
      { status: 400 }
    );
  }
}
