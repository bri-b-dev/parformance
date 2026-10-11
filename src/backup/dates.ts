/** "12.10.2026" for an ISO timestamp (local day). */
export function formatBackupDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

/** "heute", "gestern" or "vor 5 Tagen" (calendar days). */
export function relativeDays(iso: string, now: Date = new Date()): string {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((day(now) - day(new Date(iso))) / 86_400_000)
  if (diff <= 0) return 'heute'
  if (diff === 1) return 'gestern'
  return `vor ${diff} Tagen`
}
