import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notificationSchema } from '@/lib/validations';

// GET /api/notifications — list all notifications (newest first)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unread') === 'true';

  const notifications = await prisma.notification.findMany({
    where: {
      userId: (session.user as any).id,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return NextResponse.json({ notifications, unreadCount });
}

// POST /api/notifications — create a custom reminder / notif
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = notificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const notification = await prisma.notification.create({
    data: {
      userId: (session.user as any).id,
      ...parsed.data,
      type: parsed.data.type ?? 'CUSTOM',
    },
  });

  return NextResponse.json({ notification }, { status: 201 });
}

// PATCH /api/notifications — mark all as read
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: (session.user as any).id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/notifications — delete all read notifications
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === 'true';

  await prisma.notification.deleteMany({
    where: {
      userId: (session.user as any).id,
      ...(all ? {} : { isRead: true }),
    },
  });

  return NextResponse.json({ success: true });
}
