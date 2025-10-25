#!/usr/bin/env node
/**
 * Validate drills JSON against the JSON Schema (schemas/drills.schema.json).
 *
 * Looks for src/data/drills.json. If the file does not exist, exits 0 with a note
 * (MVP: presence of the file is optional). If the file exists, validates via Ajv.
 */
import { readFile } from 'node:fs/promises';
import { access, constants } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const drillsPath = resolve(process.cwd(), 'src/data/drills.json');
const schemaPath = resolve(process.cwd(), 'schemas/drills.schema.json');

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

(async function main() {
  if (!(await fileExists(drillsPath))) {
    warn(`No drills file found at ${drillsPath}. Skipping (nothing to validate).`);
    process.exit(0);
  }

  let drills;
  try {
    const raw = await readFile(drillsPath, 'utf8');
    drills = JSON.parse(raw);
  } catch (e) {
    fail(`Cannot read/parse JSON: ${e.message}`);
  }

  let schema;
  try {
    const rawSchema = await readFile(schemaPath, 'utf8');
    schema = JSON.parse(rawSchema);
  } catch (e) {
    fail(`Cannot read schema at ${schemaPath}: ${e.message}`);
  }

  const ajv = new Ajv2020({ allErrors: true, strict: false });

  const validate = ajv.compile(schema);
  const valid = validate(drills);
  if (!valid) {
    const errs = validate.errors || [];
    const details = errs.map((e) => {
      const loc = e.instancePath || '(root)';
      const msg = e.message || 'invalid';
      const params = e.params ? JSON.stringify(e.params) : '';
      return ` - ${loc} ${msg} ${params}`.trim();
    }).join('\n');
    console.error(details);
    fail(`${errs.length} issue(s) found`);
  }

  ok(`${Array.isArray(drills) ? drills.length : 0} drill(s) valid`);
  process.exit(0);
})();
