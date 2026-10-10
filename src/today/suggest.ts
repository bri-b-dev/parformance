import type { Drill, Session } from '@/types'
import type { AreaDrill } from '@/stats/areas'

export interface Suggestion {
  drill: Drill
  /** One sentence explaining why this drill is suggested. */
  reason: string
  minutes: number
  score: number
}

export interface SuggestContext {
  drills: Drill[]
  sessions: Session[]
  now: Date
  /** Drills below target from `computeAreasOfImprovement` (target-HCP mode carries latestValue/targetValue). */
  belowTarget: AreaDrill[]
  /** Category score 0-100 from `computeCategoryScores`. Categories without sessions are ignored. */
  categoryScores: Record<string, number>
  targetHcp?: number | null
  favorites?: string[]
  /** Active focus point; drills of its collection get a boost. */
  focus?: { label: string; drillIds: string[] } | null
}

const DAY = 86_400_000

/** Planned minutes of a drill: suggested, else hard stop, else timer preset, else 10. */
export function drillMinutes(d: Drill): number {
  const m = d.duration?.suggestedMin ?? d.duration?.hardStop ?? (d.duration?.timerPreset ? Math.ceil(d.duration.timerPreset / 60) : undefined)
  return typeof m === 'number' && m > 0 ? m : 10
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Small deterministic pseudo random in [0, 1): stable during a day, different on other days. */
function jitter(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= h >>> 15
  h = Math.imul(h, 2246822519)
  h ^= h >>> 13
  return ((h >>> 0) % 10_000) / 10_000
}

function fmt(n: number): string {
  return String(Math.round(n * 10) / 10).replace('.', ',')
}

/** Score every drill by how much it is needed today; best first. */
export function scoreDrills(ctx: SuggestContext): Suggestion[] {
  const today = dayKey(ctx.now)
  const below = new Map(ctx.belowTarget.map(a => [a.id, a]))
  const fav = new Set(ctx.favorites ?? [])
  const focusIds = new Set(ctx.focus?.drillIds ?? [])

  const lastByDrill = new Map<string, Session>()
  const playedCategories = new Set<string>()
  const byId = new Map(ctx.drills.map(d => [d.id, d]))
  for (const s of ctx.sessions) {
    const prev = lastByDrill.get(s.drillId)
    if (!prev || s.date > prev.date) lastByDrill.set(s.drillId, s)
    const cat = byId.get(s.drillId)?.category
    if (cat) playedCategories.add(cat)
  }

  let weakest: { category: string; pct: number } | null = null
  for (const c of playedCategories) {
    const pct = ctx.categoryScores[c] ?? 0
    if (!weakest || pct < weakest.pct) weakest = { category: c, pct }
  }

  return ctx.drills
    .map<Suggestion>(drill => {
      const last = lastByDrill.get(drill.id)
      const days = last ? Math.max(0, Math.floor((ctx.now.getTime() - new Date(last.date).getTime()) / DAY)) : null
      const gap = below.get(drill.id)
      const pct = playedCategories.has(drill.category) ? (ctx.categoryScores[drill.category] ?? 0) : null

      let score = 0
      let reason = 'Passt gut in dein Training heute.'
      let reasonWeight = 0
      const consider = (weight: number, text: string) => {
        score += weight
        if (weight > reasonWeight) { reasonWeight = weight; reason = text }
      }

      if (gap) {
        const w = 2 + (gap.gap ?? 1)
        consider(w, gap.targetValue != null
          ? `Unter deinem Ziel-HCP ${fmt(ctx.targetHcp ?? 0)}: zuletzt ${fmt(gap.latestValue ?? 0)}, Ziel ${fmt(gap.targetValue)}.`
          : `Level ${Math.round(gap.latestLevel)} von 3 - hier ist noch Luft nach oben.`)
      }
      if (ctx.focus && focusIds.has(drill.id)) consider(2.5, `Passt zu deinem Fokus „${ctx.focus.label}".`)
      if (days === null) {
        consider(1.5, 'Noch nie gespielt - gut zum Kennenlernen.')
      } else {
        const w = (Math.min(days, 30) / 30) * 2
        consider(days >= 14 ? w : w * 0.5, `Zuletzt vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}.`)
      }
      if (pct !== null) {
        const w = ((100 - pct) / 100) * 1.5
        const isWeakest = weakest?.category === drill.category && pct < 100
        consider(isWeakest ? w + 0.5 : w * 0.6, `${drill.category} ist deine schwächste Kategorie (${Math.round(pct)} %).`)
      } else {
        score += 0.4
      }
      if (fav.has(drill.id)) score += 0.4
      if (last && dayKey(new Date(last.date)) === today) score -= 3

      score += jitter(`${today}|${drill.id}`) * 0.5
      return { drill, reason, minutes: drillMinutes(drill), score }
    })
    .sort((a, b) => b.score - a.score)
}

/** Top suggestions with at most `perCategory` drills from the same category. */
export function suggestDrills(ctx: SuggestContext, count = 3, perCategory = 1): Suggestion[] {
  const out: Suggestion[] = []
  const used = new Map<string, number>()
  for (const s of scoreDrills(ctx)) {
    if ((used.get(s.drill.category) ?? 0) >= perCategory) continue
    out.push(s)
    used.set(s.drill.category, (used.get(s.drill.category) ?? 0) + 1)
    if (out.length >= count) break
  }
  return out
}

export interface SessionPlan {
  items: Suggestion[]
  totalMinutes: number
  budget: number
}

/**
 * A training session that fits into `budget` minutes: best drills first, at most two per category,
 * drills longer than the remaining time are skipped. Always contains at least the shortest good fit if any drill fits.
 */
export function planSession(ctx: SuggestContext, budget: number): SessionPlan {
  const items: Suggestion[] = []
  const used = new Map<string, number>()
  let total = 0
  for (const s of scoreDrills(ctx)) {
    if (total + s.minutes > budget) continue
    if ((used.get(s.drill.category) ?? 0) >= 2) continue
    items.push(s)
    used.set(s.drill.category, (used.get(s.drill.category) ?? 0) + 1)
    total += s.minutes
    if (total >= budget) break
  }
  return { items, totalMinutes: total, budget }
}
