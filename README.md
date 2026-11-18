# Physis World Model Playground

An interactive, public playground for learning how **Physis** builds a world
model: observations ground facts, identity joins domains, rules derive with
named premises, and truth maintenance keeps the world honest under change.

Built on [microsoft/Ontology-Playground](https://github.com/microsoft/Ontology-Playground)
(MIT licence, preserved in [LICENSE](LICENSE); copyright notice preserved in
[NOTICE](NOTICE)). The graph viewer, course/quiz/navigation infrastructure is
reused; the ontology lessons, branding and the Physis fixture are Physis work.

## What it teaches

Three lessons in the **Physis World Model** path:

1. **Observations and Identity** — a fact exists because a source reported it;
   identity merges two namings of the same thing only on evidence.
2. **Inference and Provenance** — observed vs inferred vs provenance edges;
   click a derived claim and see the rule and the premises behind it.
3. **Truth Maintenance and Retraction** — retract a premise and watch which
   conclusions survive; contradictions are findings, not noise.

The fixture is a canonical Physis world (printer / job / inventory / location)
with named sources on every fact.

## What the engine can and cannot infer — stated up front

- It will not invent a fact to fill a gap. Missing observations stay missing.
- It will not merge two objects on a name match alone. Identity needs evidence.
- It will not run a rule whose premises are absent and quietly return a default;
  it abstains and names the missing premise.
- It will not keep a conclusion alive after its last supporting premise is gone.
- It will not resolve a contradiction by silent majority or recency.
- It will not rewrite history: past beliefs stay recorded with validity windows.

## Non-goals / constraints

- The native Physis egui GUI is unchanged; this is a separate web surface.
- **Never a second source of truth.** No relation appears here that Physis does
  not hold; the (future) live bridge is read-only and typed.
- No arbitrary command execution from the browser.
- No private data in public/static builds.
- Bounded rendering: semantic summaries + neighbourhood expansion.
- RDF/OWL import/export is an adapter, never a replacement for the observation
  model.

## Roadmap

1. **Phase 1 (this):** Physis branding, the canonical fixture, three lessons,
   graph exploration and query inspection on the static build.
2. **Phase 2:** typed read-only adapter over canonical Physis snapshots and
   query results; source inspection, evidence chains, revision diffs.
3. **Phase 3:** resettable scenario worlds, observation edits, derivation
   inspection, revision rewind, agent comparisons.

## Development

```bash
npm install
npm run dev        # local dev server
npm run build      # catalogue + lessons + typecheck + vite build
npm test           # vitest suite
npm run validate   # RDF validation for catalogue entries
```
