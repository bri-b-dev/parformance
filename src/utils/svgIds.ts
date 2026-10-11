/**
 * Make the ids of an inline SVG unique (`arrow` -> `t3-arrow`) including every reference to them,
 * so several diagrams on one page cannot pick up each other's markers or gradients.
 */
export function scopeSvgIds(svg: string, prefix: string): string {
  const ids = Array.from(new Set(Array.from(svg.matchAll(/\sid="([^"]+)"/g), m => m[1])))
  let out = svg
  for (const id of ids) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const next = `${prefix}-${id}`
    out = out
      .replace(new RegExp(`(\\sid=")${esc}(")`, 'g'), `$1${next}$2`)
      .replace(new RegExp(`url\\(#${esc}\\)`, 'g'), `url(#${next})`)
      .replace(new RegExp(`((?:xlink:)?href=")#${esc}(")`, 'g'), `$1#${next}$2`)
  }
  return out
}
