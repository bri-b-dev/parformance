#!/usr/bin/env node
/**
 * Validate drills JSON against a minimal schema distilled from MVP_1.md.
 *
 * Looks for src/data/drills.json. If the file does not exist, exits 0 with a note
 * (MVP: presence of the file is optional). If the file exists, validates each drill.
 */
import { readFile } from 'node:fs/promises';
import { access, constants } from 'node:fs';
import { resolve } from 'node:path';

const drillsPath = resolve(process.cwd(), 'src/data/drills.json');

function fileExists(path) {
  return new Promise((res) => access(path, constants.F_OK, (err) => res(!err)));
}

function fail(msg) {
  console.error(`validate:drills ❌  ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`validate:drills ✅  ${msg}`);
}

function warn(msg) {
  console.warn(`validate:drills ⚠️  ${msg}`);
}

function isRecord(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function nonEmptyString(s) {
  return typeof s === 'string' && s.trim().length > 0;
}

function isStringArray(a) {
  return Array.isArray(a) && a.every((x) => typeof x === 'string');
}

function isNumberArray(a) {
  return Array.isArray(a) && a.every((x) => typeof x === 'number' && Number.isFinite(x));
}

function validateDrill(d, index) {
  const where = `drill #${index}${d && d.id ? ` (${d.id})` : ''}`;
  if (!isRecord(d)) return `${where}: not an object`;
  if (!nonEmptyString(d.id)) return `${where}: missing id`;
  if (!nonEmptyString(d.title)) return `${where}: missing title`;
  if (!nonEmptyString(d.category)) return `${where}: missing category`;

  if (!isRecord(d.equipment)) return `${where}: equipment must be object`;
  if ('balls' in d.equipment && typeof d.equipment.balls !== 'number') return `${where}: equipment.balls must be number`;
  if ('clubs' in d.equipment && !isStringArray(d.equipment.clubs)) return `${where}: equipment.clubs must be string[]`;
  if ('other' in d.equipment && !isStringArray(d.equipment.other)) return `${where}: equipment.other must be string[]`;

  if (!isRecord(d.setup)) return `${where}: setup must be object`;
  if (!nonEmptyString(d.setup.schema)) return `${where}: setup.schema required`;
  if ('diagram' in d.setup && !nonEmptyString(d.setup.diagram)) return `${where}: setup.diagram must be string`;
  if ('location' in d.setup && !nonEmptyString(d.setup.location)) return `${where}: setup.location must be string`;

  if (!isRecord(d.duration)) return `${where}: duration must be object`;
  if ('suggestedMin' in d.duration && typeof d.duration.suggestedMin !== 'number') return `${where}: duration.suggestedMin must be number`;
  if ('hardStop' in d.duration && typeof d.duration.hardStop !== 'number') return `${where}: duration.hardStop must be number`;
  if ('timerPreset' in d.duration && typeof d.duration.timerPreset !== 'number') return `${where}: duration.timerPreset must be number`;

  if (!isRecord(d.instructions)) return `${where}: instructions must be object`;
  if (!nonEmptyString(d.instructions.training)) return `${where}: instructions.training required`;
  if ('test' in d.instructions && !nonEmptyString(d.instructions.test)) return `${where}: instructions.test must be string`;
  if ('tooEasy' in d.instructions && !nonEmptyString(d.instructions.tooEasy)) return `${where}: instructions.tooEasy must be string`;

  if (!isRecord(d.metric)) return `${where}: metric must be object`;
  const metricTypes = new Set(['streak','count_in_time','points_total','stations_cleared','corridor_hits','score_vs_par']);
  if (!nonEmptyString(d.metric.type) || !metricTypes.has(d.metric.type)) return `${where}: metric.type invalid`;
  if (!nonEmptyString(d.metric.unit)) return `${where}: metric.unit required`;
  if (!isRecord(d.metric.hcpTargets)) return `${where}: metric.hcpTargets must be object`;
  // Expect 3 buckets, each with number[3]
  const buckets = Object.entries(d.metric.hcpTargets);
  if (buckets.length === 0) return `${where}: metric.hcpTargets must have at least one bucket`;
  for (const [bucket, arr] of buckets) {
    if (!isNumberArray(arr) || arr.length < 1) return `${where}: hcpTargets['${bucket}'] must be number[]`;
  }

  if ('tags' in d && !isStringArray(d.tags)) return `${where}: tags must be string[]`;
  if ('variants' in d && !isStringArray(d.variants)) return `${where}: variants must be string[]`;

  return null; // valid
}

(async function main() {
  if (!(await fileExists(drillsPath))) {
    warn(`No drills file found at ${drillsPath}. Skipping (nothing to validate).`);
    process.exit(0);
  }
  let json;
  try {
    const raw = await readFile(drillsPath, 'utf8');
    json = JSON.parse(raw);
  } catch (e) {
    fail(`Cannot read/parse JSON: ${e.message}`);
  }

  if (!Array.isArray(json)) {
    fail('Root must be an array of drills');
  }

  const errors = [];
  json.forEach((d, i) => {
    const err = validateDrill(d, i);
    if (err) errors.push(err);
  });

  if (errors.length) {
    console.error(errors.map((e) => ` - ${e}`).join('\n'));
    fail(`${errors.length} issue(s) found`);
  }

  ok(`${json.length} drill(s) valid`);
  process.exit(0);
})();
