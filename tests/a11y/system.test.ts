import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Guards for the design system: styling comes from tokens and classes, icons from one set.
 * They scan the sources, so a regression fails the build with the file and line.
 * src/modules (the imported handicap area) is excluded: it has its own scoped design.
 */
function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'modules' || e.name === 'data') continue
      walk(p, out)
    } else if (/\.(vue|ts|css)$/.test(e.name)) out.push(p)
  }
  return out
}

const files = walk('src')
const vue = files.filter(f => f.endsWith('.vue'))
const lines = (f: string) => readFileSync(f, 'utf8').split('\n').map((text, i) => ({ text, n: i + 1 }))

function offenders(list: string[], test: (line: string, file: string) => boolean): string[] {
  return list.flatMap(f => lines(f).filter(l => test(l.text, f)).map(l => `${f}:${l.n}  ${l.text.trim().slice(0, 100)}`))
}

describe('design system guards', () => {
  it('has no static inline style attributes (layout and color come from classes)', () => {
    expect(offenders(vue, l => /(^|\s)style="/.test(l))).toEqual([])
  })

  it('uses :style only for data-driven geometry, never for color, spacing or typography', () => {
    const bad = offenders(vue, l => /:style=/.test(l) && /(color|background|margin|padding|font|display|border)/.test(l.replace(/:style=/, '')))
    expect(bad).toEqual([])
  })

  it('has no emoji (the icon set and plain text symbols are used instead)', () => {
    const textSymbols = new Set('★☆●○✕▲▼►↑↓✓↻×−–·…'.split(''))
    const bad = offenders(files, l => (l.match(/\p{Extended_Pictographic}|\p{Emoji_Presentation}/gu) ?? []).some(c => !textSymbols.has(c)))
    expect(bad).toEqual([])
  })

  it('has no hard-coded hex colors in components (tokens only); only the native status bar color is allowed', () => {
    const hex = /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/
    const bad = offenders(files.filter(f => !f.endsWith('theme.css') && !f.endsWith('tailwind.css') && !f.endsWith('main.ts')), l => hex.test(l.replace(/url\(#[^)]*\)|href="#[^"]*"/g, '')))
    expect(bad).toEqual([])
    // the one exception is documented where it is used
    expect(readFileSync('src/main.ts', 'utf8')).toMatch(/setBackgroundColor\(\{color: '#[0-9A-Fa-f]{6}'\}\)/)
  })

  it('has no Tailwind palette colors (they ignore the tokens and the dark theme)', () => {
    const palette = /\b(?:text|bg|border|ring|divide|from|to|via)-(?:gray|zinc|slate|neutral|stone|red|blue|green|amber|yellow|emerald)-\d{2,3}\b/
    expect(offenders(vue, l => palette.test(l))).toEqual([])
  })

  it('uses radius tokens for anything larger than a hairline corner', () => {
    const bad = offenders([...vue, 'src/assets/theme.css'], l => {
      if (/^\s*--radius/.test(l)) return false
      const m = /border-radius:\s*(\d+)px/.exec(l)
      return !!m && Number(m[1]) > 6
    })
    expect(bad).toEqual([])
  })

  it('has one z-index scale: no literal z-index above the header layer in components', () => {
    const bad = offenders(vue, l => /z-index:\s*(\d{3,})/.test(l))
    expect(bad).toEqual([])
  })
})
