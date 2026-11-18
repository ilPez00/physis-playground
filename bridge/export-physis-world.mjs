#!/usr/bin/env node
// Export a Physis world as a physis-playground/1 snapshot: a read-only
// projection of the engine's own read surfaces (object list, incident
// relations, observation history) joined into one typed document.
//
// Honesty rules:
// - the document records the seq cut it was taken at; it is a snapshot, not
//   a live view and never a second source of truth;
// - every relation carries the observations that ground it (source, time,
//   seq, produced_by) or an explicit empty evidence list — absence is stated,
//   never padded;
// - nothing is inferred here: the exporter only joins what the engine prints.

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, '..', 'public', 'physis-world.json');

const physis = process.env.PHYSIS_BIN || 'physis';
const storeDir = process.env.PHYSIS_STORE_DIR || undefined;
const worldName = process.env.PHYSIS_WORLD_NAME || 'Physis world snapshot';

function run(args) {
  const stdout = execFileSync(physis, args, {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    env: storeDir
      ? { ...process.env, PHYSIS_STORE_DIR: storeDir }
      : process.env,
  });
  return JSON.parse(stdout);
}

const objectsResp = run(['object', 'list', '--json']);
const objects = objectsResp.objects ?? [];
if (!objectsResp.count && objects.length === 0) {
  console.error('refusing: the world reports no objects — is the store dir right?');
  process.exit(2);
}

// Relations: the engine pages them per object; join per object and dedupe.
const seen = new Set();
const relations = [];
for (const obj of objects) {
  let resp;
  try {
    resp = run(['object', 'relations', obj.id, '--json']);
  } catch (err) {
    console.error(`relations read failed for ${obj.id}: ${err.message}`);
    process.exit(2);
  }
  for (const row of resp.rows ?? []) {
    const from = row.direction === 'in' ? row.source : row.source;
    const to = row.direction === 'in' ? row.target : row.target;
    // The engine reports both directions per endpoint; normalise to one edge.
    const key = `${row.source}|${row.predicate}|${row.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    relations.push({
      from: row.source,
      verb: row.predicate,
      to: row.target,
      confidence: row.confidence,
    });
  }
}

// Provenance: walk the observation history and attach rows to the relation
// they declare (`rel|VERB|from|to`) or the object they observe.
const history = run(['history', '--json', '--limit', '100000']);
const relIndex = new Map(relations.map((r) => [`${r.from}|${r.verb}|${r.to}`, r]));
const objIndex = new Map(objects.map((o) => [o.id, o]));
let maxSeq = 0;
for (const obs of history.observations ?? []) {
  if (typeof obs.seq === 'number' && obs.seq > maxSeq) maxSeq = obs.seq;
  const m = /^rel\|([^|]+)\|(.+)\|(.+)$/.exec(obs.subject ?? '');
  const evidence = {
    seq: obs.seq,
    at: obs.at,
    source: obs.source,
    producedBy: obs.produced_by || '',
  };
  if (m) {
    const rel = relIndex.get(`${m[2]}|${m[1]}|${m[3]}`)
      ?? relIndex.get(`${m[3]}|${m[1]}|${m[2]}`);
    if (rel) (rel.evidence ??= []).push(evidence);
    continue;
  }
  // Object-level observation: attach to every object the subject names.
  for (const obj of objects) {
    if ((obs.subject ?? '').includes(obj.id)) {
      (objIndex.get(obj.id).evidence ??= []).push(evidence);
      break;
    }
  }
}

// Entity types: one per distinct kind, with honest counts.
const kinds = new Map();
for (const obj of objects) {
  const kind = obj.kind || 'unknown';
  if (!kinds.has(kind)) {
    kinds.set(kind, { id: kind, name: kind, count: 0 });
  }
  kinds.get(kind).count += 1;
}

const snapshot = {
  schema: 'physis-playground/1',
  world: {
    name: worldName,
    seqCut: maxSeq,
    exportedAt: new Date().toISOString(),
  },
  limits: {
    statement:
      'Read-only projection of a Physis world at the recorded seq cut. '
      + 'Not a live view and never a second source of truth: every fact '
      + 'here exists because the engine holds it, with its grounding '
      + 'observations attached. Absence of evidence is stated as absence.',
  },
  entityTypes: [...kinds.values()],
  objects: objects.map((o) => ({
    id: o.id,
    kind: o.kind || 'unknown',
    label: o.label,
    evidence: o.evidence ?? [],
  })),
  relations: relations.map((r) => ({
    ...r,
    evidence: r.evidence ?? [],
  })),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + '\n');
console.log(
  `wrote ${outPath}: ${objects.length} objects, ${relations.length} relations, `
  + `${snapshot.entityTypes.length} kinds, seq cut ${maxSeq}`,
);
