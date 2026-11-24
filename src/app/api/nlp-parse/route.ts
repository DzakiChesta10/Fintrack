import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseNaturalLanguageInput } from '@/lib/nlp';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt teks tidak boleh kosong' },
        { status: 400 }
      );
    }

    const [categories, wallets] = await Promise.all([
      prisma.category.findMany({ where: { userId } }),
      prisma.wallet.findMany({ where: { userId } }),
    ]);

    const parsed = parseNaturalLanguageInput(prompt, categories, wallets);

    // Resolve IDs
    const matchedCategory = categories.find(
      (c) => c.name === parsed.matchedCategoryName
    );
    const matchedWallet = wallets.find(
      (w) => w.name === parsed.matchedWalletName
    );
    const matchedDestWallet = wallets.find(
      (w) => w.name === parsed.matchedDestinationWalletName
    );

    return NextResponse.json({
      parsed: {
        ...parsed,
        categoryId: matchedCategory?.id || null,
        walletId: matchedWallet?.id || (wallets[0]?.id ?? null),
        destinationWalletId: matchedDestWallet?.id || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal memproses AI input' },
      { status: 500 }
    );
  }
}
