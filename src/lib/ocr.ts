/**
 * OCR Receipt Parser & Heuristics
 * Extracts Merchant Name, Total Amount, and Date from raw OCR text or simulated receipts.
 */

export interface ParsedReceipt {
  merchantName: string;
  totalAmount: number;
  date: string; // YYYY-MM-DD
  rawText?: string;
  confidence: number;
}

export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let merchantName = 'Toko / Restoran';
  let totalAmount = 0;
  let date = new Date().toISOString().split('T')[0];

  // 1. Merchant Detection: Look at the first 3 lines
  if (lines.length > 0) {
    // Check for common merchant brands
    const knownBrands = [
      'Indomaret',
      'Alfamart',
      'Superindo',
      'Starbucks',
      'Kopi Kenangan',
      'McDonald',
      'KFC',
      'Sushi Tei',
      'HokBen',
      'FamilyMart',
      'Guardian',
      'Watson',
      'Lawson',
    ];
    const foundBrand = knownBrands.find((brand) =>
      text.toLowerCase().includes(brand.toLowerCase())
    );
    if (foundBrand) {
      merchantName = foundBrand;
    } else {
      merchantName = lines[0].replace(/[^a-zA-Z0-9\s&.-]/g, '').slice(0, 40) || 'Struk Belanja';
    }
  }

  // 2. Date Detection (DD/MM/YYYY or YYYY-MM-DD)
  const dateRegex = /(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/;
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    let day = parseInt(dateMatch[1], 10);
    let month = parseInt(dateMatch[2], 10);
    let year = parseInt(dateMatch[3], 10);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // 3. Total Amount Detection
  // Search for lines containing TOTAL, GRAND TOTAL, JUMLAH, NETT, RP
  const totalKeywords = ['grand total', 'total akhir', 'total', 'jumlah', 'tagihan', 'nett', 'bayar'];
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const kw of totalKeywords) {
      if (lowerLine.includes(kw)) {
        // Extract numbers from this line or adjacent
        const numMatches = line.match(/(?:rp\.?|idr)?\s*([\d.,]+)/i);
        if (numMatches) {
          const cleanNum = numMatches[1].replace(/\./g, '').replace(',', '.');
          const parsed = parseFloat(cleanNum);
          if (!isNaN(parsed) && parsed > 500) {
            totalAmount = parsed;
            break;
          }
        }
      }
    }
    if (totalAmount > 0) break;
  }

  // Fallback: look for highest realistic number with currency pattern
  if (totalAmount === 0) {
    const allNumbers = text.match(/(?:rp\.?|idr)?\s*(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)/gi) || [];
    let max = 0;
    for (const numStr of allNumbers) {
      const clean = numStr.replace(/[^0-9]/g, '');
      const val = parseFloat(clean);
      if (val > max && val < 50_000_000) {
        max = val;
      }
    }
    totalAmount = max;
  }

  return {
    merchantName,
    totalAmount: Math.round(totalAmount),
    date,
    rawText: text,
    confidence: totalAmount > 0 ? 0.9 : 0.5,
  };
}

// Preset samples for portfolio testing
export const DEMO_RECEIPTS = [
  {
    name: 'Kopi Kenangan (QRIS)',
    text: `KOPI KENANGAN MALL GRAND INDONESIA
Jl. M.H. Thamrin No.1, Jakarta
Tanggal: 24/11/2026 14:15
--------------------------------
1x Kenangan Mantan Large    32.000
1x Toast Coklat Klasik       18.000
Subtotal:                    50.000
PB1 (10%):                    5.000
TOTAL:                       55.000
Metode: QRIS BCA
Terima Kasih atas kunjungan Anda!`,
    expected: {
      merchant: 'Kopi Kenangan',
      amount: 55000,
    },
  },
  {
    name: 'Superindo Supermarket',
    text: `SUPERINDO DUREN TIGA
Tgl: 23-11-2026 18:30:11
--------------------------------
1  BERAS SETRA RAMOS 5KG    74.500
2  MINYAK GORENG TROPICAL   38.000
1  SUSU GREENFIELDS 1L      31.500
1  TELUR AYAM NEGERI 1KG    28.000
--------------------------------
SUBTOTAL                    172.000
DISCOUNT                      5.000
GRAND TOTAL                 167.000
TUNAI                       200.000
KEMBALI                      33.000`,
    expected: {
      merchant: 'Superindo',
      amount: 167000,
    },
  },
  {
    name: 'Sushi Tei Restaurant',
    text: `SUSHI TEI SENAYAN CITY
Date: 22/11/2026 20:45
Table: 14 - Guest: 2
--------------------------------
1 Salmon Sashimi             68.000
1 Tuna Salad Crispy Roll     52.000
2 Ocha Dingin                24.000
Sub Total                   144.000
Service 7.5%                 10.800
Tax 10%                      15.480
TOTAL TAGIHAN               170.280
Card Payment: BCA DEBIT`,
    expected: {
      merchant: 'Sushi Tei',
      amount: 170280,
    },
  },
];
