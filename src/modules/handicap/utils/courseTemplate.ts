import type { CourseTemplate } from '../db'

export type TemplateForm = {
  name: string
  tee: string
  holes: number | ''
  courseRating: number | null
  slope: number | null
  par: number | null
}

export type TemplateErrors = Partial<Record<'name' | 'holes' | 'courseRating' | 'slope' | 'par', true>>

export function emptyTemplateForm(): TemplateForm {
  return { name: '', tee: '', holes: 18, courseRating: null, slope: null, par: null }
}

/** Returns the invalid fields (empty object = valid). */
export function validateTemplate(f: TemplateForm): TemplateErrors {
  const errors: TemplateErrors = {}
  if (!f.name.trim()) errors.name = true
  if (f.holes !== 9 && f.holes !== 18) errors.holes = true
  if (!f.courseRating || f.courseRating <= 0) errors.courseRating = true
  if (!f.slope || f.slope < 55 || f.slope > 155) errors.slope = true
  if (f.par !== null && (!Number.isFinite(f.par) || f.par <= 0)) errors.par = true
  return errors
}

export function toTemplate(f: TemplateForm): CourseTemplate {
  return {
    name: f.name.trim(),
    tee: f.tee.trim(),
    holes: f.holes as number,
    courseRating: f.courseRating as number,
    slope: f.slope as number,
    ...(f.par ? { par: f.par } : {}),
  }
}

export function toForm(t: CourseTemplate): TemplateForm {
  return { name: t.name, tee: t.tee, holes: t.holes, courseRating: t.courseRating, slope: t.slope, par: t.par ?? null }
}

/** Display label, e.g. "Course X – rot, Damen (9)" */
export function templateLabel(t: CourseTemplate): string {
  return `${t.name}${t.tee ? ` – ${t.tee}` : ''} (${t.holes})`
}
