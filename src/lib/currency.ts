export function getCurrencySymbol(currency: string): string {
  if (currency === 'USD') return '$';
  if (currency === 'GBP') return '£';
  return '€';
}

/** USD and GBP go before the amount; EUR and others go after. */
export function isCurrencyPrefix(currency: string): boolean {
  return currency === 'USD' || currency === 'GBP';
}

export function formatMoney(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  const value = amount.toFixed(2);
  return isCurrencyPrefix(currency) ? `${symbol}${value}` : `${value} ${symbol}`;
}
