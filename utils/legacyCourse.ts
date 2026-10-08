/**
 * Rounds saved without a course name used "<CR>/<Slope>" (e.g. "72/113") as courseName.
 * Returns the parsed values, or null for any other (real) course name.
 */
export function parseLegacyCourseName(name: string): { courseRating: number; slope: number } | null {
  const m = /^(\d{2}(?:[.,]\d)?)\/(\d{2,3})$/.exec(name?.trim() ?? '')
  if (!m) return null
  return { courseRating: Number.parseFloat(m[1].replace(',', '.')), slope: Number.parseInt(m[2], 10) }
}
