#!/usr/bin/env node
/**
 * Lightweight Axe check using jsdom.
 * This validates representative HTML for key UI parts to ensure labels, aria, and focus affordances are present.
 */
import { readFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import axe from 'axe-core'

function fail(msg) { console.error(`axe ❌  ${msg}`); process.exit(1) }
function ok(msg) { console.log(`axe ✅  ${msg}`) }

// Build a minimal HTML document that includes our theme styles, and representative markup
async function buildDocument() {
  // Try to include theme.css so color-contrast checks are realistic
  let themeCss = ''
  try {
    themeCss = await readFile(new URL('../src/assets/theme.css', import.meta.url), 'utf8')
  } catch {}

  const html = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>Parformance Axe Check</title>
  <style>${themeCss}</style>
</head>
<body>
  <main>
    <!-- Loading status region -->
    <div class="p-4" role="status" aria-live="polite">
      <span class="inline-block" aria-hidden="true"></span>
      <span>Lade Trainingsspiele…</span>
    </div>

    <!-- Filters region -->
    <section class="row" role="region" aria-labelledby="filter-heading">
      <h2 id="filter-heading" class="sr-only">Filter</h2>
      <div class="field">
        <label class="label" for="filter-category">Kategorie</label>
        <select id="filter-category" class="input">
          <option value="">Alle</option>
          <option value="chipping">Chipping</option>
        </select>
      </div>
      <div class="field">
        <fieldset aria-describedby="tags-help">
          <legend class="label">Tags</legend>
          <p id="tags-help" class="sr-only">Wähle beliebige Tags aus, um die Liste zu filtern.</p>
          <label class="chip"><input type="checkbox" id="tag-a" /> a</label>
        </fieldset>
      </div>
    </section>

    <!-- Form with labels and descriptions -->
    <form class="card" aria-labelledby="drill-form-title">
      <h2 id="drill-form-title" class="sr-only">Drill anlegen oder bearbeiten</h2>
      <div class="field">
        <label class="label" for="title">Titel</label>
        <input id="title" class="input" required />
      </div>
      <div class="field">
        <label class="label" for="category">Kategorie</label>
        <select id="category" class="input" required>
          <option>Chipping</option>
        </select>
      </div>
      <div class="field">
        <label class="label" for="tags">Tags</label>
        <input id="tags" class="input" aria-describedby="tags-help2" />
        <p id="tags-help2" class="sr-only">Mehrere Tags mit Komma trennen.</p>
      </div>
      <div>
        <button class="btn" type="button">Abbrechen</button>
        <button class="btn btn-primary" type="submit">Speichern</button>
      </div>
    </form>
  </main>
</body>
</html>`
  return html
}

;(async function main() {
  const html = await buildDocument()
  const dom = new JSDOM(html, { url: 'http://localhost/' })
  const { window } = dom
  // Inject axe source into the JSDOM window
  const script = window.document.createElement('script')
  script.innerHTML = axe.source
  window.document.head.appendChild(script)

  // Run axe on the whole document
  const results = await window.axe.run(window.document, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'best-practice']
    }
  })

  if (results.violations.length > 0) {
    console.error('Axe violations found:')
    for (const v of results.violations) {
      console.error(` - [${v.id}] ${v.help}: ${v.nodes.length} node(s)`) 
    }
    fail(`${results.violations.length} violation(s)`) 
  }

  ok('No violations')
  process.exit(0)
})().catch(e => fail(e?.message || String(e)))
