import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FinTrack Database Seeding...');

  // Clean existing demo user
  const existingUser = await prisma.user.findUnique({
    where: { email: 'demo@fintrack.app' },
  });

  if (existingUser) {
    await prisma.user.delete({
      where: { id: existingUser.id },
    });
    console.log('🧹 Cleaned existing demo user data.');
  }

  // 1. Create Demo User
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Alex Pratama',
      email: 'demo@fintrack.app',
      password: hashedPassword,
      currency: 'IDR',
      pinCode: '1234',
    },
  });

  console.log(`👤 User created: ${user.name} (${user.email})`);

  // 2. Create Wallets
  const walletBCA = await prisma.wallet.create({
    data: {
      userId: user.id,
      name: 'Rekening BCA Utama',
      type: 'BANK',
      balance: 18750000,
      color: '#2563eb',
      icon: 'landmark',
    },
  });

  const walletCash = await prisma.wallet.create({
    data: {
      userId: user.id,
      name: 'Dompet Tunai',
      type: 'CASH',
      balance: 1450000,
      color: '#16a34a',
      icon: 'banknote',
    },
  });

  const walletGoPay = await prisma.wallet.create({
    data: {
      userId: user.id,
      name: 'GoPay / QRIS',
      type: 'E_WALLET',
      balance: 625000,
      color: '#0891b2',
      icon: 'smartphone',
    },
  });

  const walletBibit = await prisma.wallet.create({
    data: {
      userId: user.id,
      name: 'Investasi Bibit Reksadana',
      type: 'INVESTMENT',
      balance: 15000000,
      color: '#7c3aed',
      icon: 'trending-up',
    },
  });

  console.log('💳 Created 4 Wallets (BCA, Cash, GoPay, Bibit)');

  // 3. Create Categories
  const catIncomeSalary = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Gaji Pokok',
      type: 'INCOME',
      color: '#16a34a',
      icon: 'briefcase',
      isDefault: true,
    },
  });

  const catIncomeBonus = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Bonus & THR',
      type: 'INCOME',
      color: '#10b981',
      icon: 'gift',
      isDefault: true,
    },
  });

  const catIncomeFreelance = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Freelance & Side Project',
      type: 'INCOME',
      color: '#0284c7',
      icon: 'laptop',
      isDefault: true,
    },
  });

  const catIncomeInvestment = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Dividen & Investasi',
      type: 'INCOME',
      color: '#8b5cf6',
      icon: 'trending-up',
      isDefault: true,
    },
  });

  const catFood = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Makanan & Minuman',
      type: 'EXPENSE',
      color: '#ea580c',
      icon: 'utensils',
      isDefault: true,
    },
  });

  const catTransport = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Transportasi',
      type: 'EXPENSE',
      color: '#ca8a04',
      icon: 'car',
      isDefault: true,
    },
  });

  const catBills = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Tagihan & Utilitas',
      type: 'EXPENSE',
      color: '#dc2626',
      icon: 'receipt',
      isDefault: true,
    },
  });

  const catGroceries = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Belanja Bulanan & Supermarket',
      type: 'EXPENSE',
      color: '#db2777',
      icon: 'shopping-cart',
      isDefault: true,
    },
  });

  const catEntertainment = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Hiburan & Langganan',
      type: 'EXPENSE',
      color: '#9333ea',
      icon: 'tv',
      isDefault: true,
    },
  });

  const catHealth = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Kesehatan & Farmasi',
      type: 'EXPENSE',
      color: '#0d9488',
      icon: 'heart-pulse',
      isDefault: true,
    },
  });

  console.log('🏷️ Created standard Categories (Income & Expense)');

  // 4. Sample Transactions
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const transactionsData = [
    // Income
    {
      userId: user.id,
      type: 'INCOME',
      amount: 14500000,
      date: new Date(currentYear, currentMonth, 1, 9, 0),
      notes: 'Gaji Bulanan PT Teknologi Indonesia',
      walletId: walletBCA.id,
      categoryId: catIncomeSalary.id,
    },
    {
      userId: user.id,
      type: 'INCOME',
      amount: 3200000,
      date: new Date(currentYear, currentMonth, 10, 14, 30),
      notes: 'Fee UI/UX Design Project Mobile App',
      walletId: walletBCA.id,
      categoryId: catIncomeFreelance.id,
    },
    {
      userId: user.id,
      type: 'INCOME',
      amount: 450000,
      date: new Date(currentYear, currentMonth, 15, 11, 0),
      notes: 'Dividen Reksadana Pasar Uang',
      walletId: walletBibit.id,
      categoryId: catIncomeInvestment.id,
    },
    // Transfers
    {
      userId: user.id,
      type: 'TRANSFER',
      amount: 750000,
      date: new Date(currentYear, currentMonth, 3, 10, 15),
      notes: 'Top-up GoPay untuk jajan & ojol mingguan',
      walletId: walletBCA.id,
      destinationWalletId: walletGoPay.id,
    },
    {
      userId: user.id,
      type: 'TRANSFER',
      amount: 500000,
      date: new Date(currentYear, currentMonth, 5, 12, 0),
      notes: 'Tarik tunai di ATM BCA Mall',
      walletId: walletBCA.id,
      destinationWalletId: walletCash.id,
    },
    {
      userId: user.id,
      type: 'TRANSFER',
      amount: 2000000,
      date: new Date(currentYear, currentMonth, 8, 16, 0),
      notes: 'Nabung investasi Bibit bulanan',
      walletId: walletBCA.id,
      destinationWalletId: walletBibit.id,
    },
    // Expenses
    {
      userId: user.id,
      type: 'EXPENSE',
      amount: 1850000,
      date: new Date(currentYear, currentMonth, 2, 8, 30),
      notes: 'Sewa Kos / Maintenance Kamar',
      walletId: walletBCA.id,
      categoryId: catBills.id,
    },
    {
      userId: user.id,
      type: 'EXPENSE',
      amount: 380000,
      date: new Date(currentYear, currentMonth, 4, 19, 0),
      notes: 'Listrik PLN & Tagihan Internet Indihome',
      walletId: walletBCA.id,
      categoryId: catBills.id,
    },
    {
      userId: user.id,
      type: 'EXPENSE',
      amount: 720000,
      date: new Date(currentYear, currentMonth, 6, 17, 30),
      notes: 'Belanja Bahan Makanan & Sabun Superindo',
      walletId: walletBCA.id,
      categoryId: catGroceries.id,
    },
    {
      userId: user.id,
      type: 'EXPENSE',
      amount: 48000,
      date: new Date(currentYear, currentMonth, 7, 12, 45),
      notes: 'Makan siang Ayam Geprek & Es Teh',
      walletId: walletCash.id,
      categoryId: catFood.id,
    },
    {
      userId: user.id,
      type: 'EXPENSE',
      amount: 35000,
      date: new Date(currentYear, currentMonth, 8, 8, 15),
      notes: 'Kopi Kenangan Mantan Large QRIS',
      walletId: walletGoPay.id,
      categoryId: catFood.id,
    },
    {
      userId: user.id,
      type: 'EXPENSE',
      amount: 42000,
      date: new Date(currentYear, currentMonth, 9, 18, 20),
      notes: 'Gojek dari kantor ke stasiun MRT',
      walletId: walletGoPay.id,
      categoryId: catTransport.id,
    },
    {
      userId: user.id,
      type: 'EXPENSE',
      amount: 186000,
      date: new Date(currentYear, currentMonth, 12, 10, 0),
      notes: 'Langganan Netflix Premium & Spotify Family',
      walletId: walletBCA.id,
      categoryId: catEntertainment.id,
    },
    {
      userId: user.id,
      type: 'EXPENSE',
      amount: 145000,
      date: new Date(currentYear, currentMonth, 14, 20, 10),
      notes: 'Beli Vitamin C & Obat Flu di Guardian',
      walletId: walletGoPay.id,
      categoryId: catHealth.id,
    },
    {
      userId: user.id,
      type: 'EXPENSE',
      amount: 165000,
      date: new Date(currentYear, currentMonth, 16, 13, 0),
      notes: 'Makan Sushi siang bareng teman kantor',
      walletId: walletGoPay.id,
      categoryId: catFood.id,
    },
  ];

  for (const tx of transactionsData) {
    await prisma.transaction.create({ data: tx });
  }

  console.log(`💸 Seeded ${transactionsData.length} Transactions`);

  // 5. Budgets for Current Month
  const currentMonthNumber = currentMonth + 1; // 1 - 12
  await prisma.budget.createMany({
    data: [
      {
        userId: user.id,
        categoryId: catFood.id,
        amount: 2500000,
        month: currentMonthNumber,
        year: currentYear,
        alertThreshold: 0.8,
      },
      {
        userId: user.id,
        categoryId: catTransport.id,
        amount: 800000,
        month: currentMonthNumber,
        year: currentYear,
        alertThreshold: 0.8,
      },
      {
        userId: user.id,
        categoryId: catGroceries.id,
        amount: 1500000,
        month: currentMonthNumber,
        year: currentYear,
        alertThreshold: 0.8,
      },
      {
        userId: user.id,
        categoryId: catBills.id,
        amount: 2500000,
        month: currentMonthNumber,
        year: currentYear,
        alertThreshold: 0.85,
      },
      {
        userId: user.id,
        categoryId: catEntertainment.id,
        amount: 600000,
        month: currentMonthNumber,
        year: currentYear,
        alertThreshold: 0.8,
      },
    ],
  });

  console.log('📊 Seeded Monthly Budgets');

  // 6. Recurring Transactions
  await prisma.recurringTransaction.createMany({
    data: [
      {
        userId: user.id,
        name: 'Gaji Bulanan',
        type: 'INCOME',
        amount: 14500000,
        frequency: 'MONTHLY',
        startDate: new Date(currentYear, currentMonth, 25),
        nextRunDate: new Date(currentYear, currentMonth + 1, 25),
        isActive: true,
        notes: 'Gaji tetap dari kantor masuk BCA',
        categoryId: catIncomeSalary.id,
        walletId: walletBCA.id,
      },
      {
        userId: user.id,
        name: 'Sewa Kamar Kos',
        type: 'EXPENSE',
        amount: 1850000,
        frequency: 'MONTHLY',
        startDate: new Date(currentYear, currentMonth, 1),
        nextRunDate: new Date(currentYear, currentMonth + 1, 1),
        isActive: true,
        notes: 'Transfer pemilik kos via BCA',
        categoryId: catBills.id,
        walletId: walletBCA.id,
      },
      {
        userId: user.id,
        name: 'Langganan Netflix & Spotify',
        type: 'EXPENSE',
        amount: 186000,
        frequency: 'MONTHLY',
        startDate: new Date(currentYear, currentMonth, 15),
        nextRunDate: new Date(currentYear, currentMonth + 1, 15),
        isActive: true,
        notes: 'Autodebet bulanan',
        categoryId: catEntertainment.id,
        walletId: walletBCA.id,
      },
    ],
  });

  console.log('🔄 Seeded Recurring Transactions');

  // 7. Savings Goals
  await prisma.savingsGoal.createMany({
    data: [
      {
        userId: user.id,
        name: 'Dana Darurat (6x Pengeluaran)',
        targetAmount: 30000000,
        currentAmount: 18500000,
        targetDate: new Date(currentYear + 1, 5, 30),
        color: '#10b981',
        icon: 'shield-alert',
        walletId: walletBibit.id,
      },
      {
        userId: user.id,
        name: 'Upgrade MacBook Pro M3',
        targetAmount: 26000000,
        currentAmount: 14200000,
        targetDate: new Date(currentYear, 11, 25),
        color: '#3b82f6',
        icon: 'laptop',
        walletId: walletBCA.id,
      },
      {
        userId: user.id,
        name: 'Liburan ke Jepang',
        targetAmount: 22000000,
        currentAmount: 7500000,
        targetDate: new Date(currentYear + 1, 3, 15),
        color: '#f59e0b',
        icon: 'plane',
        walletId: walletBCA.id,
      },
    ],
  });

  console.log('🎯 Seeded Savings Goals');

  // 8. Split Bill Sample
  await prisma.splitBill.create({
    data: {
      userId: user.id,
      title: 'Makan Malam Sushi Tei Bareng Tim',
      totalAmount: 645000,
      myShare: 215000,
      participantsCount: 3,
      status: 'SETTLED',
      details: JSON.stringify({
        taxPercent: 10,
        servicePercent: 5,
        participants: [
          { name: 'Alex (Saya)', share: 215000, isPaid: true },
          { name: 'Budi Santoso', share: 215000, isPaid: true },
          { name: 'Citra Dewi', share: 215000, isPaid: true },
        ],
      }),
    },
  });

  console.log('🍕 Seeded Sample Split Bill');
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
