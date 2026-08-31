export function isRateLimitError(message?: string) {
  return !!message && /too many requests/i.test(message);
}
