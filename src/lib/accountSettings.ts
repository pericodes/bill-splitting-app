export const ACCOUNT_ICONS = [
  "flight",
  "restaurant",
  "home",
  "sports_esports",
  "shopping_bag",
  "directions_car",
  "school",
  "savings",
] as const;

export const ACCOUNT_CURRENCIES = ["EUR", "USD", "GBP"] as const;

export type AccountCurrency = (typeof ACCOUNT_CURRENCIES)[number];

const ICON_PATTERN = /^[a-z0-9_]+$/i;

export function isAccountCurrency(value: string): value is AccountCurrency {
  return (ACCOUNT_CURRENCIES as readonly string[]).includes(value);
}

export function isAccountIcon(value: string) {
  return ICON_PATTERN.test(value);
}

export function iconChoices(current?: string) {
  if (current && !(ACCOUNT_ICONS as readonly string[]).includes(current)) {
    return [current, ...ACCOUNT_ICONS];
  }
  return ACCOUNT_ICONS;
}
