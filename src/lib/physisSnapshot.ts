/**
 * Typed loader for physis-playground/1 snapshots — the read-only bridge
 * between a Physis world and this playground.
 *
 * Contract (see bridge/export-physis-world.mjs and README):
 * - a snapshot is a projection of one world at one seq cut;
 * - every object and relation carries its grounding observations (evidence)
 *   or an explicitly empty list — absence is stated, never padded;
 * - the loader validates the shape and refuses anything else: a malformed
 *   snapshot is an error, not a silently half-rendered graph.
 */

export interface PhysisEvidence {
  seq: number;
  at: string;
  source: string;
  producedBy: string;
}

export interface PhysisObject {
  id: string;
  kind: string;
  label: string;
  evidence: PhysisEvidence[];
}

export interface PhysisRelation {
  from: string;
  verb: string;
  to: string;
  confidence?: number;
  evidence: PhysisEvidence[];
}

export interface PhysisEntityType {
  id: string;
  name: string;
  count: number;
}

export interface PhysisSnapshot {
  schema: string;
  world: { name: string; seqCut: number; exportedAt: string };
  limits: { statement: string };
  entityTypes: PhysisEntityType[];
  objects: PhysisObject[];
  relations: PhysisRelation[];
}

export const PHYSIS_SNAPSHOT_SCHEMA = 'physis-playground/1';

export class PhysisSnapshotError extends Error {}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function evidenceList(v: unknown, where: string): PhysisEvidence[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) throw new PhysisSnapshotError(`${where}: evidence must be an array`);
  return v.map((e, i) => {
    if (!isRecord(e)) throw new PhysisSnapshotError(`${where}[${i}]: evidence entry must be an object`);
    if (typeof e.seq !== 'number' || typeof e.at !== 'string'
      || typeof e.source !== 'string' || typeof e.producedBy !== 'string') {
      throw new PhysisSnapshotError(`${where}[${i}]: evidence entry needs seq, at, source, producedBy`);
    }
    return { seq: e.seq, at: e.at, source: e.source, producedBy: e.producedBy };
  });
}

/** Parse and validate a snapshot document; refuses anything malformed. */
export function parsePhysisSnapshot(raw: unknown): PhysisSnapshot {
  if (!isRecord(raw)) throw new PhysisSnapshotError('snapshot must be an object');
  if (raw.schema !== PHYSIS_SNAPSHOT_SCHEMA) {
    throw new PhysisSnapshotError(
      `unsupported schema ${String(raw.schema)}; expected ${PHYSIS_SNAPSHOT_SCHEMA}`,
    );
  }
  const world = raw.world;
  const limits = raw.limits;
  if (!isRecord(world) || typeof world.name !== 'string'
    || typeof world.seqCut !== 'number' || typeof world.exportedAt !== 'string') {
    throw new PhysisSnapshotError('world must carry name, seqCut and exportedAt');
  }
  if (!isRecord(limits) || typeof limits.statement !== 'string') {
    throw new PhysisSnapshotError('limits.statement is required — a snapshot without its limits is not a snapshot');
  }
  if (!Array.isArray(raw.entityTypes) || !Array.isArray(raw.objects)
    || !Array.isArray(raw.relations)) {
    throw new PhysisSnapshotError('entityTypes, objects and relations must be arrays');
  }
  const entityTypes = raw.entityTypes.map((t, i) => {
    if (!isRecord(t) || typeof t.id !== 'string' || typeof t.name !== 'string'
      || typeof t.count !== 'number') {
      throw new PhysisSnapshotError(`entityTypes[${i}]: needs id, name, count`);
    }
    return { id: t.id, name: t.name, count: t.count };
  });
  const objects = raw.objects.map((o, i) => {
    if (!isRecord(o) || typeof o.id !== 'string' || typeof o.kind !== 'string'
      || typeof o.label !== 'string') {
      throw new PhysisSnapshotError(`objects[${i}]: needs id, kind, label`);
    }
    return {
      id: o.id,
      kind: o.kind,
      label: o.label,
      evidence: evidenceList(o.evidence, `objects[${i}]`),
    };
  });
  const relations = raw.relations.map((r, i) => {
    if (!isRecord(r) || typeof r.from !== 'string' || typeof r.verb !== 'string'
      || typeof r.to !== 'string') {
      throw new PhysisSnapshotError(`relations[${i}]: needs from, verb, to`);
    }
    if (r.confidence !== undefined && typeof r.confidence !== 'number') {
      throw new PhysisSnapshotError(`relations[${i}]: confidence must be a number`);
    }
    return {
      from: r.from,
      verb: r.verb,
      to: r.to,
      confidence: r.confidence,
      evidence: evidenceList(r.evidence, `relations[${i}]`),
    };
  });
  // Referential honesty: an edge naming an unknown endpoint is a broken
  // snapshot, not a graph with ghost nodes.
  const ids = new Set(objects.map((o) => o.id));
  for (const r of relations) {
    for (const end of [r.from, r.to]) {
      if (!ids.has(end)) {
        throw new PhysisSnapshotError(
          `relation ${r.from} --${r.verb}--> ${r.to} names unknown object ${end}`,
        );
      }
    }
  }
  return {
    schema: PHYSIS_SNAPSHOT_SCHEMA,
    world: { name: world.name, seqCut: world.seqCut, exportedAt: world.exportedAt },
    limits: { statement: limits.statement },
    entityTypes,
    objects,
    relations,
  };
}

/** Load the snapshot published next to the app (public/physis-world.json). */
export async function loadPhysisSnapshot(baseUrl = '/'): Promise<PhysisSnapshot> {
  const url = new URL('physis-world.json', baseUrl.startsWith('http') ? baseUrl : window.location.origin + baseUrl);
  const resp = await fetch(url.toString());
  if (!resp.ok) {
    throw new PhysisSnapshotError(`snapshot fetch failed: HTTP ${resp.status}`);
  }
  return parsePhysisSnapshot(await resp.json());
}

/** Kind colours for the graph — fixed palette, deterministic per kind. */
const KIND_COLORS = [
  '#0078D4', '#107C10', '#7719AA', '#FFB900', '#00B7C3',
  '#D13438', '#8764B8', '#5C2E91', '#0099BC', '#8A8886',
];

export function kindColor(kind: string): string {
  let h = 0;
  for (const ch of kind) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return KIND_COLORS[h % KIND_COLORS.length];
}
