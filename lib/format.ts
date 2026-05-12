export function fmtMoney(n: number | null): string {
  if (n == null) return '—';
  return '$' + n.toLocaleString('en-US');
}

export function fmtMoneyCompact(n: number | null): string {
  if (n == null) return '—';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'k';
  return '$' + n;
}

export function fmtNum(n: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US');
}

export function fmtPct(n: number | null): string {
  if (n == null) return '—';
  return Math.round(n * 100) + '%';
}
