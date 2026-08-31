export function csvEscape(value: string, separator: string): string {
  if (
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r") ||
    value.includes(separator)
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function formatSignedAmount(amount: number, decimalComma: boolean): string {
  const formatted = Math.abs(amount).toFixed(2);
  const withDecimal = decimalComma ? formatted.replace(".", ",") : formatted;
  if (amount > 0) return `+${withDecimal}`;
  if (amount < 0) return `-${withDecimal}`;
  return withDecimal;
}

/** Formats YYYY-MM-DD without timezone shifts. */
export function formatCsvDate(raw: string | undefined, language: string): string {
  const ymd = (raw || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return raw || "";
  const [year, month, day] = ymd.split("-");
  return language.startsWith("en") ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

export function buildCsv(
  headers: string[],
  rows: string[][],
  separator: string,
): string {
  const line = (cells: string[]) =>
    cells.map((cell) => csvEscape(cell, separator)).join(separator);
  return [line(headers), ...rows.map(line)].join("\r\n");
}

export function downloadCsvFile(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[<>:"/\\|?*]+/g, " ").trim().replace(/\s+/g, " ");
  return cleaned || "cuenta";
}
