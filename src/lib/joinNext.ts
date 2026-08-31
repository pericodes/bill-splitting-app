const JOIN_NEXT =
  /^\/join\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function safeJoinNext(raw?: string | string[] | null): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  if (!JOIN_NEXT.test(decoded)) return null;
  return decoded;
}
