import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan password wajib diisi' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan login.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        currency: 'IDR',
      },
    });

    // Create default wallets
    await prisma.wallet.createMany({
      data: [
        {
          userId: user.id,
          name: 'Dompet Tunai',
          type: 'CASH',
          balance: 0,
          color: '#16a34a',
          icon: 'banknote',
        },
        {
          userId: user.id,
          name: 'Rekening Bank Utama',
          type: 'BANK',
          balance: 0,
          color: '#2563eb',
          icon: 'landmark',
        },
        {
          userId: user.id,
          name: 'E-Wallet (QRIS)',
          type: 'E_WALLET',
          balance: 0,
          color: '#0891b2',
          icon: 'smartphone',
        },
      ],
    });

    // Create default categories
    await prisma.category.createMany({
      data: [
        { userId: user.id, name: 'Gaji Pokok', type: 'INCOME', color: '#16a34a', icon: 'briefcase', isDefault: true },
        { userId: user.id, name: 'Bonus & THR', type: 'INCOME', color: '#10b981', icon: 'gift', isDefault: true },
        { userId: user.id, name: 'Freelance & Side Project', type: 'INCOME', color: '#0284c7', icon: 'laptop', isDefault: true },
        { userId: user.id, name: 'Makanan & Minuman', type: 'EXPENSE', color: '#ea580c', icon: 'utensils', isDefault: true },
        { userId: user.id, name: 'Transportasi', type: 'EXPENSE', color: '#ca8a04', icon: 'car', isDefault: true },
        { userId: user.id, name: 'Tagihan & Utilitas', type: 'EXPENSE', color: '#dc2626', icon: 'receipt', isDefault: true },
        { userId: user.id, name: 'Belanja Bulanan', type: 'EXPENSE', color: '#db2777', icon: 'shopping-cart', isDefault: true },
        { userId: user.id, name: 'Hiburan & Liburan', type: 'EXPENSE', color: '#9333ea', icon: 'tv', isDefault: true },
      ],
    });

    return NextResponse.json({
      message: 'Registrasi berhasil',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat registrasi' },
      { status: 500 }
    );
  }
}
