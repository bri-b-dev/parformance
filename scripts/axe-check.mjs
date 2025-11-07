#!/usr/bin/env node
/**
 * Lightweight Axe check using jsdom.
 * This validates representative HTML for key UI parts to ensure labels, aria, and focus affordances are present.
 */
import { readFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import { createRequire } from 'module'

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
  // Create jsdom window and set globals before importing axe-core so
  // axe-core can detect the DOM environment on import (some builds read
  // globals at module initialization).
  // Save previous globals and only override when safe (writable or absent).
  const prevGlobals = {}
  function trySetGlobal(name, value) {
    const desc = Object.getOwnPropertyDescriptor(global, name)
    prevGlobals[name] = { had: typeof global[name] !== 'undefined', desc, value: global[name] }
    try {
      if (!desc) {
        global[name] = value
        prevGlobals[name].assigned = true
      } else if (desc.writable === true || desc.configurable === true) {
        global[name] = value
        prevGlobals[name].assigned = true
      } else {
        // property exists but is not writable/configurable; skip assigning
        prevGlobals[name].assigned = false
        console.log(`Skipping global override for ${name} (non-writable/non-configurable)`)
      }
    } catch (e) {
      prevGlobals[name].assigned = false
      console.log(`Failed to set global.${name}:`, e && e.message ? e.message : String(e))
    }
  }

  trySetGlobal('window', window)
  trySetGlobal('document', window.document)
  trySetGlobal('navigator', window.navigator)
  if (window.Node) trySetGlobal('Node', window.Node)
  if (window.Element) trySetGlobal('Element', window.Element)

  // jsdom's HTMLCanvasElement.getContext throws unless the optional
  // "canvas" package is installed. Axe-core may call getContext to
  // measure icons/text. Provide a harmless stub to avoid the not-
  // implemented exception. Return null which axe handles gracefully.
  try {
    if (window.HTMLCanvasElement && window.HTMLCanvasElement.prototype) {
      try {
        // Overwrite the implementation with a no-op that returns null.
        window.HTMLCanvasElement.prototype.getContext = function () { return null }
        console.log('Patched window.HTMLCanvasElement.prototype.getContext to noop')
      } catch (e) {
        console.log('Could not patch HTMLCanvasElement.getContext:', e && e.message ? e.message : String(e))
      }
    }
  } catch (e) {
    // best-effort; continue
  }

  // Import axe-core after setting up the JSDOM window to allow axe to
  // detect globals during module initialization. Fall back to CJS if
  // dynamic import fails.
  let axe
  try {
    const mod = await import('axe-core')
    axe = mod
  } catch (impErr) {
    try {
      const req = createRequire(import.meta.url)
      axe = req('axe-core')
    } catch (reqErr) {
      console.error('Failed to import axe-core (esm and cjs).', impErr && impErr.message, reqErr && reqErr.message)
      fail('axe-core import failed')
    }
  }

  // Diagnostic: print what we imported so failing environments are easier to debug.
  console.log('axe type:', typeof axe)
  try { console.log('axe keys:', Object.keys(axe || {})) } catch (e) {}

  // Run axe on the whole document using the imported axe-core module.
  // We pass the JSDOM document as the context.
  // Resolve the actual run function. axe-core distributions sometimes expose
  // the API as the default export (axe.default.run) or directly as axe.run.
  let results
  const candidates = [
    ['axe.run', axe?.run],
    ['axe.default.run', axe?.default?.run],
    ['axe["module.exports"].run', axe?.['module.exports']?.run]
  ]
  let runFn = null
  let runKey = null
  for (const [key, fn] of candidates) {
    if (typeof fn === 'function') { runFn = fn; runKey = key; break }
  }

  if (!runFn) {
    console.error('axe.run not found. Imported axe keys:', Object.keys(axe || {}))
    fail('axe.run unavailable')
  }

  console.log('Using axe run function from:', runKey)

  // Globals were set earlier (so axe-core can detect them on import).

  try {
    // Ensure proper `this` binding in case the implementation expects it.
    results = await runFn.call(axe?.default || axe, window.document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'best-practice']
      }
    })
  } catch (e) {
    console.error('Error invoking axe.run:', e && e.message ? e.message : String(e))

    // If axe complains about missing globals, attempt a CJS require fallback.
    const msg = e && e.message ? e.message : String(e)
    if (msg.includes('Required "window" or "document" globals not defined')) {
      console.log('Attempting CJS require fallback for axe-core using createRequire')
      try {
        const req = createRequire(import.meta.url)
        const axeCjs = req('axe-core')
        // detect run function similarly
        const runCandidates = [axeCjs?.run, axeCjs?.default?.run, axeCjs?.['module.exports']?.run]
        const runCandidate = runCandidates.find(fn => typeof fn === 'function')
        if (!runCandidate) {
          console.error('CJS axe-core loaded but run function not found:', Object.keys(axeCjs || {}))
          fail('CJS axe.run unavailable')
        }
        console.log('Using CJS axe run')
        results = await runCandidate.call(axeCjs?.default || axeCjs, window.document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] }
        })
      } catch (e2) {
        console.error('CJS axe.run attempt failed:', e2 && e2.message ? e2.message : String(e2))
        // Print some diagnostics about global property descriptors to help debugging
        try {
          console.log('global.window descriptor:', Object.getOwnPropertyDescriptor(global, 'window'))
          console.log('global.document descriptor:', Object.getOwnPropertyDescriptor(global, 'document'))
          console.log('global.navigator descriptor:', Object.getOwnPropertyDescriptor(global, 'navigator'))
        } catch (dErr) {}
        fail('axe.run failed')
      }
    } else {
      fail('axe.run failed')
    }
  } finally {
    // restore only the globals we assigned
    for (const name of Object.keys(prevGlobals)) {
      const p = prevGlobals[name]
      if (p.assigned) {
        if (p.had) {
          try { global[name] = p.value } catch (e) { /* best effort */ }
        } else {
          try { delete global[name] } catch (e) { /* best effort */ }
        }
      }
    }
  }

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
