import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notificationSchema } from '@/lib/validations';

type Params = { params: { id: string } };

// PATCH /api/notifications/[id] — update (mark read / edit custom)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.notification.findFirst({
    where: { id: params.id, userId: (session.user as any).id },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();

  // Allow toggling isRead and/or editing CUSTOM notifications
  const updateData: any = {};
  if ('isRead' in body) updateData.isRead = Boolean(body.isRead);

  if (existing.type === 'CUSTOM' && Object.keys(body).some((k) => k !== 'isRead')) {
    const parsed = notificationSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    Object.assign(updateData, parsed.data);
  }

  const updated = await prisma.notification.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({ notification: updated });
}

// DELETE /api/notifications/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.notification.findFirst({
    where: { id: params.id, userId: (session.user as any).id },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.notification.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
