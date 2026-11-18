---
title: Observations and Identity
slug: physis-observations-and-identity
description: In Physis a fact exists because a source reported it. Learn how observations ground the world and how identity merges two namings of the same thing.
order: 1
---

## Facts have sources

Most graph databases store facts and move on. Physis asks one more question: **who reported this, and when?** Every fact in the world model is grounded by an observation — a source saying something at a time. No observation, no fact.

This is why the Physis world model can be honest about its own contents. When you inspect an object you can always walk back to the observation that grounds it. A claim without a source is not silently accepted; it is either refused or labelled as exactly what it is.

## The printer, the warehouse and the same toner

Consider a real cross-domain case:

- The **fleet monitor** reports a printer using a toner cartridge it calls `85A`.
- The **warehouse system** tracks stock under the SKU `CF258A`.

These are two namings of the same physical cartridge. Neither system knows about the other. If you admit both edges as-is, the world model contains a printer "consuming" an item that is never depleted — because the two namings were never joined.

**Identity** is the step that fixes this: evidence that `85A` and `CF258A` denote the same thing lets Physis admit the relation across the domain boundary, with the derivation recorded. The join is evidence-backed or it does not happen.

## What to look for in the explorer

Open the Physis World Model fixture and click any object:

1. **Its observations** — which source reported it, and when.
2. **Its identity** — whether this object is the canonical representative of one real thing, or one of two names awaiting a merge.
3. **What is absent** — Physis distinguishes "not observed" from "observed to be absent". The explorer shows both as different states.

## What the engine will not do

- It will not invent a fact to fill a gap. Missing observations stay missing.
- It will not merge two objects on a name match alone. Identity needs evidence.
- It will not hide a contradiction. Two sources disagreeing is a finding, not noise.

<ontology-embed id="official/physis-world" height="400px"></ontology-embed>

*The Physis fixture: printers, jobs, stock and locations, each grounded by named observations. Click an edge to see whether it was observed or derived.*
