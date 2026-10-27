export function formatDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return 'Data indisponível';
  const [, year, month, day] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() !== Number(month) - 1 ||
    parsed.getUTCDate() !== Number(day)
  )
    return 'Data indisponível';
  return `${day}/${month}/${year}`;
}

export function formatTime(referenceTime: string | null): string | null {
  if (referenceTime === null) return null;
  const match = /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})$/.exec(referenceTime);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${match[1]}:${match[2]}`;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'Indisponível';
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
    useGrouping: false,
  }).format(Object.is(value, -0) ? 0 : value);
}
