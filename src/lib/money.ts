/**
 * Safe Monetary Utility
 * Prevents floating-point rounding errors (e.g., 0.1 + 0.2 = 0.30000000000000004)
 * Supports IDR, USD, and SGD with accurate rounding and localized formatting.
 */

export const CURRENCY_RATES: Record<string, number> = {
  // Base is IDR
  IDR: 1,
  USD: 16000,
  SGD: 12000,
};

export function roundMoney(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function addMoney(a: number, b: number): number {
  return roundMoney(roundMoney(a) + roundMoney(b));
}

export function subtractMoney(a: number, b: number): number {
  return roundMoney(roundMoney(a) - roundMoney(b));
}

export function multiplyMoney(amount: number, multiplier: number): number {
  return roundMoney(roundMoney(amount) * multiplier);
}

export function formatCurrency(
  amount: number,
  currency: string = 'IDR',
  options?: { showPrefix?: boolean; compact?: boolean }
): string {
  const safeAmount = roundMoney(amount);
  const showPrefix = options?.showPrefix ?? true;

  if (currency === 'IDR') {
    if (options?.compact && Math.abs(safeAmount) >= 1_000_000) {
      const millions = safeAmount / 1_000_000;
      return `${showPrefix ? 'Rp ' : ''}${millions.toFixed(1)}jt`;
    }
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(safeAmount);
    return showPrefix ? `Rp ${formatted}` : formatted;
  }

  if (currency === 'USD') {
    const formatted = new Intl.NumberFormat('en-US', {
      style: showPrefix ? 'currency' : 'decimal',
      currency: 'USD',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(safeAmount);
    return formatted;
  }

  if (currency === 'SGD') {
    const formatted = new Intl.NumberFormat('en-SG', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(safeAmount);
    return showPrefix ? `S$ ${formatted}` : formatted;
  }

  return `${showPrefix ? currency + ' ' : ''}${safeAmount.toLocaleString()}`;
}

export function convertCurrency(
  amount: number,
  from: string = 'IDR',
  to: string = 'IDR'
): number {
  if (from === to) return roundMoney(amount);
  const fromRate = CURRENCY_RATES[from] || 1;
  const toRate = CURRENCY_RATES[to] || 1;
  // Convert from -> IDR -> target
  const inIDR = amount * fromRate;
  const converted = inIDR / toRate;
  return roundMoney(converted);
}

export function parseMoneyInput(input: string): number {
  if (!input) return 0;
  // Clean whitespace and currency signs
  const cleaned = input
    .replace(/[Rp$S\s]/gi, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : roundMoney(parsed);
}
