---
title: Truth Maintenance and Retraction
slug: physis-truth-maintenance
description: Retract a premise and watch which conclusions survive. Contradictions are findings, not noise — and the world remembers what it stopped believing.
order: 3
---

## Why retraction is hard

Adding facts is easy. The hard part is **taking one away**: every conclusion that was derived from it must be found and re-evaluated, while conclusions with other support must survive. Systems that skip this accumulate stale beliefs forever.

Physis keeps a **truth maintenance system (TMS)**: derived conclusions remember the premises they were derived from, so retracting a premise identifies exactly which conclusions lose support.

## The retraction exercise

Take the delivery-zone conclusion from the previous lesson:

1. `CF258A` is stocked at `LOC-2F-EAST` — **observed** by the warehouse sync.
2. `LOC-DESK-VERONA` is in the same building as `LOC-2F-EAST` — **observed** by a placement scan.
3. Therefore the desk **can-serve** from that stock — **inferred** by the delivery-zone rule.

Now the warehouse sync reports a correction: the `CF258A` stock was moved to a different building. What happens?

- The `stocked-at` edge is **retracted** (the source that asserted it now asserts otherwise — sources own their facts).
- The `can-serve` conclusion **loses its support** and is retracted with it, with a diagnostic naming the retraction as the cause.
- Nothing else in the world moves: the printer, the jobs and the observations that did not depend on the moved stock are untouched.

This is the difference between a world model and a cache: the world only contains what is currently supported.

## Contradictions are findings

Suppose two sources disagree — the fleet monitor says the printer is `idle`, the queue says it is `printing`. Physis does not average them, pick a winner silently, or drop one side. It records the **contradiction** as a first-class finding: both claims, both sources, both times. Resolution is a separate, visible step.

## The world remembers

Retracted facts do not vanish. The world model is temporal: it records that a fact was believed from *t₁* to *t₂*, and why it stopped. Asking "what did we believe yesterday?" is a query, not an archaeology project.

## What the engine will not do

- It will not keep a conclusion alive after its last supporting premise is gone.
- It will not resolve a contradiction by silent majority or recency.
- It will not rewrite history: past beliefs stay recorded with their validity windows.

<ontology-embed id="official/physis-world" height="400px"></ontology-embed>

*Find the `can-serve` edge and trace its premises. Which observations would have to change for this conclusion to fall — and which parts of the world would survive?*

---

**Where this path ends.** These three lessons cover the core: observations ground facts, identity joins domains, rules derive with named premises, and truth maintenance keeps the world honest under change. The live connection to a running Physis engine — editing observations and watching the world re-derive in real time — is the next stage of this playground.
