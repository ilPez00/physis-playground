import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { ArrowLeft, RefreshCw, Eye } from 'lucide-react';
import {
  loadPhysisSnapshot,
  kindColor,
  PhysisSnapshotError,
  type PhysisSnapshot,
  type PhysisEvidence,
} from '../lib/physisSnapshot';
import './PhysisLivePage.css';

interface SelectedEdge {
  verb: string;
  from: string;
  to: string;
  confidence?: number;
  evidence: PhysisEvidence[];
}

/**
 * The Physis live-snapshot page: renders the world's objects and relations
 * as they were at the snapshot's seq cut, and on click shows the grounding
 * observations — source, time, seq, produced_by. Read-only by construction:
 * nothing here writes anywhere, and the page states the snapshot's limits.
 */
export function PhysisLivePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [snapshot, setSnapshot] = useState<PhysisSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedEdge | null>(null);

  const load = () => {
    setError(null);
    setSnapshot(null);
    setSelected(null);
    loadPhysisSnapshot(`${import.meta.env.BASE_URL}`)
      .then(setSnapshot)
      .catch((err: unknown) => {
        setError(err instanceof PhysisSnapshotError ? err.message : String(err));
      });
  };

  useEffect(load, []);

  useEffect(() => {
    if (!snapshot || !containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...snapshot.objects.map((o) => ({
          data: {
            id: o.id,
            label: o.label,
            color: kindColor(o.kind),
            kind: o.kind,
          },
        })),
        ...snapshot.relations.map((r, i) => ({
          data: {
            id: `e${i}`,
            source: r.from,
            target: r.to,
            label: r.verb.toLowerCase(),
          },
          relation: r,
        })),
      ],
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'font-size': 11,
            color: '#cfd8e3',
            'text-margin-y': 6,
            width: 44,
            height: 44,
            'background-color': 'data(color)',
            'border-width': 2,
            'border-color': 'data(color)',
            'border-opacity': 0.6,
          },
        },
        {
          selector: 'edge',
          style: {
            label: 'data(label)',
            'font-size': 9,
            color: '#8fa3b8',
            width: 2,
            'line-color': '#3d556e',
            'target-arrow-color': '#3d556e',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.1,
          },
        },
      ],
      layout: { name: 'cose', animate: false, randomize: true } as cytoscape.LayoutOptions,
    });
    cy.on('tap', 'edge', (evt) => {
      const rel = (evt.target as unknown as { relation?: SelectedEdge }).relation;
      if (rel) setSelected(rel);
    });
    cy.on('tap', 'node', (evt) => {
      const obj = snapshot.objects.find((o) => o.id === evt.target.id());
      if (obj) {
        setSelected({
          verb: `object ${obj.kind}`,
          from: obj.id,
          to: '',
          evidence: obj.evidence,
        });
      }
    });
    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [snapshot]);

  return (
    <div className="physis-live">
      <header className="physis-live-header">
        <a className="physis-live-back" href="#/">
          <ArrowLeft size={16} /> Back
        </a>
        <div>
          <h1 className="physis-live-title">Physis live snapshot</h1>
          {snapshot && (
            <p className="physis-live-sub">
              {snapshot.world.name} · seq cut {snapshot.world.seqCut} · exported{' '}
              {new Date(snapshot.world.exportedAt).toLocaleString()} ·{' '}
              {snapshot.objects.length} objects · {snapshot.relations.length} relations
            </p>
          )}
        </div>
        <button className="physis-live-reload" onClick={load} title="Re-fetch the snapshot">
          <RefreshCw size={15} /> Reload
        </button>
      </header>

      {error && (
        <div className="physis-live-error" role="alert">
          <p>The snapshot could not be loaded — nothing is rendered rather than a half-world:</p>
          <code>{error}</code>
          <p>
            Export one with{' '}
            <code>node bridge/export-physis-world.mjs</code> against a Physis store.
          </p>
        </div>
      )}

      {snapshot && (
        <div className="physis-live-body">
          <div ref={containerRef} className="physis-live-graph" />
          <aside className="physis-live-inspector">
            <h2>
              <Eye size={15} /> Provenance
            </h2>
            {!selected && (
              <p className="physis-live-hint">
                Click an edge to see the observations that ground it — source,
                time, seq, and what produced it. Click a node for its own
                grounding observations.
              </p>
            )}
            {selected && (
              <div>
                <h3>
                  {selected.to
                    ? `${selected.from} —${selected.verb}→ ${selected.to}`
                    : selected.from}
                  {typeof selected.confidence === 'number' && (
                    <span className="physis-live-confidence">
                      {' '}
                      · confidence {selected.confidence}
                    </span>
                  )}
                </h3>
                {selected.evidence.length === 0 && (
                  <p className="physis-live-absent">
                    No grounding observation in this snapshot. The edge is
                    stated with its absence — not padded with a source it
                    does not have.
                  </p>
                )}
                {selected.evidence.map((e) => (
                  <div key={`${e.seq}-${e.at}`} className="physis-live-evidence">
                    <div className="physis-live-evidence-head">
                      seq {e.seq} · {e.source}
                    </div>
                    <div className="physis-live-evidence-time">
                      {new Date(e.at).toLocaleString()}
                    </div>
                    {e.producedBy && <div className="physis-live-evidence-why">{e.producedBy}</div>}
                  </div>
                ))}
              </div>
            )}
            <div className="physis-live-kinds">
              <h2>Entity kinds</h2>
              <ul>
                {snapshot.entityTypes.map((t) => (
                  <li key={t.id}>
                    <span
                      className="physis-live-dot"
                      style={{ backgroundColor: kindColor(t.id) }}
                    />
                    {t.name} <span className="physis-live-count">×{t.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="physis-live-limits">{snapshot.limits.statement}</p>
          </aside>
        </div>
      )}
    </div>
  );
}
