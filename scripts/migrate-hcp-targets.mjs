#!/usr/bin/env node
/**
 * One-off migration: normalise legacy hcpTargets to the canonical 3-level array form.
 *
 * Rules (heuristics, review the report!):
 *  - A single number (or numeric string like "+10") is treated as the TARGET for that HCP bucket = level 2.
 *    greater-is-better : [v - d, v, v + d] with d = max(1, round(25% of v)); if v - d < 1 the lowest level starts at v
 *    smaller-is-better : [v + d, v, v - d] with d = max(1, round(10% of v))
 *  - smallerIsBetter is set for drills whose unit counts strokes/minutes but whose targets get *lower* for
 *    better HCP buckets and that are not flagged yet.
 *  - Objects (descriptive targets), arrays with one value and drills without targets are only reported.
 *
 * Usage: node scripts/migrate-hcp-targets.mjs [--write]   (default: dry run, prints the report)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const write = process.argv.includes('--write');
const drillsPath = resolve(process.cwd(), 'src/data/drills.json');
const reportPath = resolve(process.cwd(), 'docs/DRILL_TARGET_MIGRATION.md');

const drills = JSON.parse(await readFile(drillsPath, 'utf8'));

const hiOf = (key) => Number(String(key).split('-')[0]);
const toNumber = (v) => (typeof v === 'number' ? v : typeof v === 'string' && /^[+-]?\d+(\.\d+)?$/.test(v.trim()) ? Number(v) : NaN);

function expand(v, smaller) {
  if (smaller) {
    const d = Math.max(1, Math.round(v * 0.1));
    return [v + d, v, v - d];
  }
  const d = Math.max(1, Math.round(v * 0.25));
  return v - d < 1 ? [v, v + 1, v + 2] : [v - d, v, v + d];
}

const lines = { migrated: [], flagged: [], manual: [], single: [], noTargets: [], suspicious: [] };

for (const drill of drills) {
  const m = drill.metric;
  const targets = m.hcpTargets;
  if (!targets || Object.keys(targets).length === 0) { lines.noTargets.push(drill.id); continue; }

  // direction: values per bucket ordered from worst (high hcp) to best (low hcp)
  const probe = Object.entries(targets)
    .map(([k, v]) => [hiOf(k), Array.isArray(v) ? v[Math.min(1, v.length - 1)] : toNumber(v)])
    .filter(([, v]) => Number.isFinite(v))
    .sort((a, b) => b[0] - a[0]);
  const decreasing = probe.length > 1 && probe.at(-1)[1] < probe[0][1];
  if (decreasing && !m.smallerIsBetter) {
    if (/Schläge|Minuten/i.test(String(m.unit))) {
      m.smallerIsBetter = true;
      lines.flagged.push(`\`${drill.id}\` (${m.unit}) → \`smallerIsBetter: true\``);
    } else {
      lines.suspicious.push(`\`${drill.id}\` (${m.unit}): targets fall for better HCP buckets but drill is "greater is better" – please check`);
    }
  }
  const smaller = !!m.smallerIsBetter;
  const skip = lines.suspicious.some((x) => x.startsWith(`\`${drill.id}\``));

  const rows = [];
  for (const [key, v] of Object.entries(targets)) {
    if (Array.isArray(v)) {
      if (v.length === 1) lines.single.push(`\`${drill.id}\` ${key}: [${v[0]}]`);
      continue;
    }
    const n = toNumber(v);
    if (skip) { lines.manual.push(`\`${drill.id}\` ${key}: ${JSON.stringify(v)} (Richtung unklar, nicht migriert)`); continue; }
    if (!Number.isFinite(n)) { lines.manual.push(`\`${drill.id}\` ${key}: ${JSON.stringify(v)}`); continue; }
    const next = expand(n, smaller);
    targets[key] = next;
    rows.push(`${key}: ${JSON.stringify(v)} → [${next.join(', ')}]`);
  }
  if (rows.length) lines.migrated.push(`- \`${drill.id}\` (${smaller ? 'kleiner ist besser' : 'größer ist besser'})\n${rows.map((r) => `  - ${r}`).join('\n')}`);
}

const section = (title, items, fmt = (x) => `- ${x}`) => (items.length ? `## ${title} (${items.length})\n\n${items.map(fmt).join('\n')}\n` : '');
const report = `# Migration der HCP-Zielwerte

Erzeugt mit \`scripts/migrate-hcp-targets.mjs\`. Einzelwerte gelten als **Ziel (Level 2)** des HCP-Bereichs; Level 1 und 3 sind
Vorschläge (größer ist besser: ±25 %, kleiner ist besser: ±10 %, jeweils mindestens ±1). **Bitte fachlich prüfen und anpassen.**

${section('Richtung korrigiert (\`smallerIsBetter\`)', lines.flagged)}
${section('Richtung prüfen', lines.suspicious)}
${section('Migrierte Einzelwerte', lines.migrated, (x) => x)}
${section('Manuell: nicht numerische Ziele', lines.manual)}
${section('Manuell: Arrays mit nur einem Wert', lines.single)}
## Manuell: Werte pro Position statt Level

- \`putting_under_pressure\`: die drei Werte je Bucket (z. B. \`[3, 1, 1]\`) sind Serien je Position (20 m / 10 m / 3 m), keine Level-Schwellen und werden aktuell falsch ausgewertet.

${section('Manuell: Drills ohne Zielwerte', lines.noTargets, (x) => `- \`${x}\``)}`;

if (write) {
  await writeFile(drillsPath, JSON.stringify(drills, null, 2) + '\n');
  await writeFile(reportPath, report.replace(/\n{3,}/g, '\n\n'));
  console.log(`written: ${drillsPath}\nreport: ${reportPath}`);
} else {
  console.log(report.replace(/\n{3,}/g, '\n\n'));
}
