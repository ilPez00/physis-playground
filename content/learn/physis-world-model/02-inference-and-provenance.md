---
title: Inference and Provenance
slug: physis-inference-and-provenance
description: Click a derived claim and see the rule, the premises and the evidence behind it — and find out exactly what the engine can and cannot infer.
order: 2
embed: sample/physis
---

## Observed vs inferred

In the Physis world model every edge carries its origin:

| Kind | Meaning | Example |
|------|---------|---------|
| **OBSERVED** | A source reported it | the queue reported `JOB-1042` on `PRT-001` |
| **INFERRED** | A rule derived it from named premises | `can-serve`, derived from `stocked-at` + `located-in` |
| **PROVENANCE** | It links a claim to its grounds | `JOB-1042` supported-by `OBS-9001` |

The distinction is not decoration. When a conclusion turns out to be wrong, the first question is *which kind was it* — a bad observation, or a rule applied to facts that no longer hold?

## The delivery-zone exercise

Here is the classic exercise, run against the fixture:

> The service desk (`LOC-DESK-VERONA`) is in the same building as the second-floor east wing (`LOC-2F-EAST`). Stock of `CF258A` sits in the east wing. **Can the service desk be served from that stock?**

A naive system answers "yes" and moves on. Physis answers with structure:

1. **The rule**: delivery is possible when a location and a stock location are joined by the delivery-zone rule's premises.
2. **The premises**: `LOC-DESK-VERONA` —same-building→ `LOC-2F-EAST`, and `CF258A` —stocked-at→ `LOC-2F-EAST`.
3. **The verdict**: the rule supports the conclusion **only if both premises hold**. If the same-building relation was never observed — if it is an assumption you imported from outside the world model — the engine says so and **abstains** rather than guessing.

Abstention is a feature. "I cannot conclude that, and here is the missing premise" is worth more than a confident maybe.

## Reading a derivation

In the fixture, find the `can-serve` edge and inspect it:

- the **rule** that derived it (named, not anonymous),
- the **premises** it consumed (clickable — each is itself grounded),
- the **derivation time** (when the rule ran, which may differ from when the premises were observed).

## What the engine will not do

- It will not run a rule whose premises are absent and quietly return a default.
- It will not present an inferred edge with the confidence of an observed one.
- It will not let a derived edge outlive its premises without marking the retraction.

<ontology-embed id="official/physis-world" height="400px"></ontology-embed>

*Trace the supported-by edges from a job to the observations that ground it. Every hop is a source, a time, and a claim.*
