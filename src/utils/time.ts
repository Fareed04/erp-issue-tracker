export function roundHours(hours: number): number {
  if (!Number.isFinite(hours) || hours <= 0) return 0;
  return Math.round(hours * 100) / 100;
}

export function formatLoggedHours(hours?: number | null): string {
  const safe = roundHours(hours ?? 0);
  if (safe === 0) return '0h';
  return `${Number(safe.toFixed(2))}h`;
}

export function formatHoursBreakdown(hours?: number | null): string {
  const safe = roundHours(hours ?? 0);
  if (safe === 0) return '0m';
  const totalMinutes = Math.round(safe * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const remMinutes = totalMinutes % 60;
  if (wholeHours === 0) return `${remMinutes}m`;
  if (remMinutes === 0) return `${wholeHours}h`;
  return `${wholeHours}h ${remMinutes}m`;
}
