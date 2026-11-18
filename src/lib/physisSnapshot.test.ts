import { describe, expect, it } from 'vitest';
import {
  PhysisSnapshotError,
  kindColor,
  parsePhysisSnapshot,
} from './physisSnapshot';

const valid = {
  schema: 'physis-playground/1',
  world: { name: 'demo', seqCut: 7, exportedAt: '2026-11-18T09:00:00Z' },
  limits: { statement: 'read-only projection' },
  entityTypes: [{ id: 'item', name: 'item', count: 1 }],
  objects: [
    {
      id: 'item:crate-1',
      kind: 'item',
      label: 'crate-1',
      evidence: [{ seq: 3, at: '2026-11-17T10:00:00Z', source: 'host', producedBy: 'declare' }],
    },
    { id: 'location:depot', kind: 'location', label: 'depot', evidence: [] },
  ],
  relations: [
    {
      from: 'location:depot',
      verb: 'STOCKED_AT',
      to: 'item:crate-1',
      confidence: 1,
      evidence: [{ seq: 6, at: '2026-11-17T10:59:32Z', source: 'host', producedBy: 'depot stocks cargo' }],
    },
  ],
};

describe('parsePhysisSnapshot', () => {
  it('accepts a valid snapshot and keeps evidence attached', () => {
    const snap = parsePhysisSnapshot(valid);
    expect(snap.world.seqCut).toBe(7);
    expect(snap.objects[0].evidence).toHaveLength(1);
    expect(snap.relations[0].evidence[0].producedBy).toBe('depot stocks cargo');
  });

  it('treats missing evidence as an explicit empty list, not undefined', () => {
    const snap = parsePhysisSnapshot({ ...valid, objects: valid.objects.map((o) => ({ ...o, evidence: undefined })) });
    expect(snap.objects[0].evidence).toEqual([]);
  });

  it('refuses a wrong or missing schema', () => {
    expect(() => parsePhysisSnapshot({ ...valid, schema: 'other/9' })).toThrow(PhysisSnapshotError);
    expect(() => parsePhysisSnapshot({ ...valid, schema: undefined })).toThrow(PhysisSnapshotError);
  });

  it('refuses a snapshot without its limits statement', () => {
    const { limits, ...without } = valid;
    void limits;
    expect(() => parsePhysisSnapshot(without)).toThrow(/limits/);
  });

  it('refuses a relation naming an unknown object', () => {
    const broken = structuredClone(valid);
    broken.relations[0].to = 'item:ghost';
    expect(() => parsePhysisSnapshot(broken)).toThrow(/unknown object item:ghost/);
  });

  it('refuses malformed evidence entries', () => {
    const broken = structuredClone(valid);
    // @ts-expect-error deliberately malformed
    broken.objects[0].evidence[0] = { seq: 'six', at: 'x', source: 'y', producedBy: 'z' };
    expect(() => parsePhysisSnapshot(broken)).toThrow(/evidence/);
  });

  it('refuses non-numeric confidence', () => {
    const broken = structuredClone(valid);
    // @ts-expect-error deliberately malformed
    broken.relations[0].confidence = 'high';
    expect(() => parsePhysisSnapshot(broken)).toThrow(/confidence/);
  });

  it('assigns deterministic colours per kind', () => {
    expect(kindColor('item')).toBe(kindColor('item'));
    expect(kindColor('item')).not.toBe(kindColor('location'));
  });
});
