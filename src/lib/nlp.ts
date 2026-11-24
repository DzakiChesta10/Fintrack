/**
 * FinTrack Natural Language Transaction Parser
 * Parses Indonesian / English conversational statements into structured transaction drafts.
 * Example: "Beli kopi kenangan 25rb pakai QRIS" -> { type: 'EXPENSE', amount: 25000, category: 'Makanan & Minuman', wallet: 'GoPay / QRIS' }
 */

export interface ParsedNLPResult {
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  notes: string;
  matchedCategoryName?: string;
  matchedWalletName?: string;
  matchedDestinationWalletName?: string;
  confidence: number;
}

export function parseNaturalLanguageInput(
  text: string,
  categories: { id: string; name: string; type: string }[] = [],
  wallets: { id: string; name: string; type: string }[] = []
): ParsedNLPResult {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Detect Amount
  let amount = 0;

  // Patterns: 1.5jt, 2.5 juta, 250rb, 50k, rp 50.000, 50000
  const jutaMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta|million)/);
  const ribuMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu|thousand)/);
  const standardRpMatch = lower.match(/(?:rp\.?|idr)\s*([\d.,]+)/);
  const bareNumberMatch = lower.match(/(?:\s|^)(\d{1,3}(?:\.\d{3})+(?:,\d+)?)(?:\s|$)/);
  const simpleDigitsMatch = lower.match(/(?:\s|^)(\d{4,9})(?:\s|$)/);

  if (jutaMatch) {
    const val = parseFloat(jutaMatch[1].replace(',', '.'));
    amount = val * 1_000_000;
  } else if (ribuMatch) {
    const val = parseFloat(ribuMatch[1].replace(',', '.'));
    amount = val * 1_000;
  } else if (standardRpMatch) {
    const cleanNum = standardRpMatch[1].replace(/\./g, '').replace(',', '.');
    amount = parseFloat(cleanNum);
  } else if (bareNumberMatch) {
    const cleanNum = bareNumberMatch[1].replace(/\./g, '').replace(',', '.');
    amount = parseFloat(cleanNum);
  } else if (simpleDigitsMatch) {
    amount = parseFloat(simpleDigitsMatch[1]);
  }

  // 2. Detect Transaction Type
  let type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE';

  if (
    lower.includes('transfer ke') ||
    lower.includes('kirim ke') ||
    lower.includes('topup') ||
    lower.includes('top up') ||
    lower.includes('pindah ke') ||
    lower.includes('tarik tunai')
  ) {
    type = 'TRANSFER';
  } else if (
    lower.includes('gaji') ||
    lower.includes('bonus') ||
    lower.includes('terima') ||
    lower.includes('dapat uang') ||
    lower.includes('pemasukan') ||
    lower.includes('freelance') ||
    lower.includes('dividen') ||
    lower.includes('income')
  ) {
    type = 'INCOME';
  }

  // 3. Match Category
  let matchedCategoryName: string | undefined;

  const categoryKeywords: Record<string, string[]> = {
    'Makanan & Minuman': ['kopi', 'makan', 'lunch', 'dinner', 'sarapan', 'ayam', 'mie', 'sushi', 'pizza', 'burger', 'bakso', 'cafe', 'resto', 'minum', 'snack', 'boba'],
    Transportasi: ['gojek', 'grab', 'bensin', 'pertalite', 'pertamax', 'parkir', 'tol', 'mrt', 'krl', 'transjakarta', 'ojol', 'taxi', 'kereta', 'pesawat'],
    'Tagihan & Utilitas': ['listrik', 'pln', 'air', 'pdam', 'internet', 'wifi', 'indihome', 'biznet', 'pulsa', 'kuota', 'sewa', 'kos', 'apartemen'],
    'Belanja Bulanan & Supermarket': ['belanja', 'superindo', 'indomaret', 'alfamart', 'sayur', 'sabun', 'shampoo', 'pasar', 'hypermart'],
    'Hiburan & Langganan': ['netflix', 'spotify', 'youtube', 'bioskop', 'nonton', 'steam', 'game', 'playstation', 'liburan', 'konser'],
    'Kesehatan & Farmasi': ['obat', 'dokter', 'apotek', 'vitamin', 'klinik', 'rumah sakit', 'panadol', 'farmasi', 'lab'],
    'Gaji Pokok': ['gaji', 'salary', 'payroll', 'kantor bulanan'],
    'Bonus & THR': ['thr', 'bonus tahunan', 'insentif'],
    'Freelance & Side Project': ['freelance', 'proyek', 'side job', 'desain', 'koding', 'client'],
    'Dividen & Investasi': ['dividen', 'reksadana', 'saham', 'crypto', 'bunga bank'],
  };

  for (const [catName, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      // Check if user has this category in their list
      const userCat = categories.find((c) =>
        c.name.toLowerCase().includes(catName.toLowerCase()) ||
        catName.toLowerCase().includes(c.name.toLowerCase())
      );
      matchedCategoryName = userCat ? userCat.name : catName;
      break;
    }
  }

  // 4. Match Wallet
  let matchedWalletName: string | undefined;
  let matchedDestinationWalletName: string | undefined;

  const walletKeywords: Record<string, string[]> = {
    CASH: ['tunai', 'cash', 'dompet fisik', 'uang tunai'],
    BANK: ['bca', 'bank', 'mandiri', 'bni', 'bri', 'jago', 'jenius'],
    E_WALLET: ['gopay', 'qris', 'ovo', 'dana', 'shopeepay', 'linkaja', 'ewallet'],
    INVESTMENT: ['bibit', 'bareksa', 'ajaib', 'stockbit', 'investasi'],
  };

  // Find source wallet
  for (const [walletType, keywords] of Object.entries(walletKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      const userWallet = wallets.find((w) =>
        w.type === walletType || keywords.some((kw) => w.name.toLowerCase().includes(kw))
      );
      if (userWallet) {
        matchedWalletName = userWallet.name;
        break;
      }
    }
  }

  // For transfer destination
  if (type === 'TRANSFER') {
    if (lower.includes('ke gopay') || lower.includes('topup gopay')) {
      const w = wallets.find((w) => w.name.toLowerCase().includes('gopay') || w.type === 'E_WALLET');
      if (w) matchedDestinationWalletName = w.name;
    } else if (lower.includes('tarik tunai') || lower.includes('ke cash') || lower.includes('ke tunai')) {
      const w = wallets.find((w) => w.type === 'CASH');
      if (w) matchedDestinationWalletName = w.name;
    } else if (lower.includes('ke bibit') || lower.includes('invest')) {
      const w = wallets.find((w) => w.type === 'INVESTMENT');
      if (w) matchedDestinationWalletName = w.name;
    }
  }

  // Default fallback if not matched
  if (!matchedWalletName && wallets.length > 0) {
    // Default to bank or cash
    matchedWalletName = wallets[0].name;
  }

  return {
    type,
    amount: isNaN(amount) ? 0 : amount,
    notes: clean,
    matchedCategoryName,
    matchedWalletName,
    matchedDestinationWalletName,
    confidence: amount > 0 ? 0.95 : 0.6,
  };
}
