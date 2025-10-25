import { describe, it, expect } from 'vitest'
import { renderSpinner, renderEmptyState } from '../../src/ui/markup'

describe('UI markup snapshots', () => {
  it('spinner default label', () => {
    expect(renderSpinner()).toMatchSnapshot()
  })

  it('spinner custom label', () => {
    expect(renderSpinner('Bitte warten…')).toMatchSnapshot()
  })

  it('empty state with title only', () => {
    expect(renderEmptyState('Keine Ergebnisse')).toMatchSnapshot()
  })

  it('empty state with title and message', () => {
    const html = renderEmptyState('Keine Drills gefunden', 'Passe die Filter an oder lege ein neues Trainingsspiel an.')
    expect(html).toMatchSnapshot()
  })
})
