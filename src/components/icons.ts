/**
 * Inner markup of the app's icons (24x24 grid, stroked with currentColor by AppIcon).
 * Static, trusted strings - never built from user input.
 */
export const ICONS = {
  ball: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r=".6"/><circle cx="13.5" cy="9" r=".6"/><circle cx="12" cy="13.5" r=".6"/><circle cx="15.5" cy="13" r=".6"/>',
  flag: '<path d="M7 21V4"/><path d="M7 4l10 3.5L7 11"/><path d="M4 21h6"/>',
  tools: '<path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5L15 12l-3-3z"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M9.5 2.5h5"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14.2L7 21l5-3 5 3-1.5-6.8"/>',
  trend: '<path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
  chart: '<path d="M4 20V5"/><path d="M4 20h16"/><path d="M8 17v-5M12 17V8M16 17v-8"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  golf: '<path d="M6 21l9-14"/><path d="M15 7c2-1 4 0 5 2l-6 3z"/>',
  flame: '<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.2 1 2 2 2-.5-3 0-5 1-8z"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  sprout: '<path d="M12 21v-9"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 15c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
} as const

export type IconName = keyof typeof ICONS

/** Icons a collection can carry (stored by name; older collections may still hold an emoji). */
export const COLLECTION_ICON_NAMES: IconName[] = ['flag', 'target', 'golf', 'flame', 'timer', 'bulb', 'sprout', 'star']

export const ICON_LABELS: Record<IconName, string> = {
  ball: 'Ball', flag: 'Fahne', tools: 'Werkzeug', timer: 'Stoppuhr', award: 'Auszeichnung', trend: 'Trend', chart: 'Diagramm',
  target: 'Ziel', golf: 'Schläger', flame: 'Flamme', bulb: 'Idee', sprout: 'Spross', star: 'Stern',
}

export const isIconName = (v: unknown): v is IconName => typeof v === 'string' && v in ICONS
