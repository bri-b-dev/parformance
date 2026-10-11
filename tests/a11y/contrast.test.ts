import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * WCAG contrast of the design tokens, read from theme.css so that a future color change cannot silently
 * break it. Text needs 4.5:1, UI boundaries and focus indicators 3:1.
 */
const css = readFileSync('src/assets/theme.css', 'utf8')

function tokens(selector: RegExp): Record<string, string> {
  const block = selector.exec(css)?.[1] ?? ''
  const out: Record<string, string> = {}
  for (const m of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) out[m[1]] = m[2]
  return out
}

const light = tokens(/:root\s*\{([\s\S]*?)\n\}/)
const dark = { ...light, ...tokens(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/) }

function luminance(hex: string): number {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// [foreground token, background token, minimum ratio, what it is]
const PAIRS: [string, string, number, string][] = [
  ['text', 'bg', 4.5, 'body text'],
  ['text', 'surface', 4.5, 'text on cards'],
  ['muted', 'bg', 4.5, 'secondary text'],
  ['muted', 'surface', 4.5, 'secondary text on cards'],
  ['primary', 'bg', 4.5, 'brand text / links'],
  ['primary', 'surface', 4.5, 'brand text on cards'],
  ['primary-ink', 'primary', 4.5, 'text on primary buttons'],
  ['accent-green', 'surface', 4.5, 'brand lockup text'],
  ['danger-ink', 'surface', 4.5, 'error text'],
  ['danger-ink', 'bg', 4.5, 'error text on the page'],
  ['level-1-ink', 'surface', 4.5, 'level 1 stars'],
  ['level-2-ink', 'surface', 4.5, 'level 2 stars'],
  ['focus', 'bg', 3, 'focus ring on the page'],
  ['focus', 'surface', 3, 'focus ring on cards'],
  ['border-strong', 'bg', 3, 'form control border on the page'],
  ['border-strong', 'surface', 3, 'form control border on cards'],
]

describe.each([['light', light], ['dark', dark]] as const)('%s theme tokens', (_name, t) => {
  it.each(PAIRS)('%s on %s >= %s (%s)', (fg, bg, min) => {
    expect(t[fg], `token --${fg}`).toBeDefined()
    expect(t[bg], `token --${bg}`).toBeDefined()
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(min)
  })

  it('text on the danger fill (reset button) is readable', () => {
    expect(contrast(t['on-danger'], t.danger)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('contrast helper', () => {
  it('matches the WCAG reference values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 1)
    expect(contrast('#ffffff', '#ffffff')).toBe(1)
  })
})

describe('focus indicator', () => {
  it('is a solid outline for every keyboard-focusable control, not just a faint glow', () => {
    expect(css).toMatch(/:focus-visible[\s\S]*?outline:\s*3px solid var\(--focus\)/)
    expect(css).not.toMatch(/outline:\s*none/)
  })
})
