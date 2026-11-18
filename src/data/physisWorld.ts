import type { Ontology } from './ontology';
import type { SampleOntologyEntry } from './sampleOntologies';

// The Physis World Model Playground fixture: a small canonical Physis world
// (the printer / job / inventory / location cross-domain join), adapted to the
// playground's Ontology type.
//
// Honesty rules carried over from the engine:
// - every entity type description says what kind of evidence grounds it;
// - relationship descriptions distinguish OBSERVED relations (a source
//   reported them) from INFERRED relations (a rule derived them, and the rule
//   is named);
// - nothing is claimed that the Physis engine would not hold: the playground
//   is never a second source of truth.

export const physisOntology: Ontology = {
  name: "Physis World Model",
  description:
    "A canonical Physis world: observations from named sources, identity " +
    "established across domains, and inferences whose premises are visible. " +
    "Retract a premise and watch which conclusions survive.",
  entityTypes: [
    {
      id: "printer",
      name: "Printer",
      description: "A physical printer observed by the fleet monitor. Grounded by device telemetry: every instance exists because a source reported it.",
      icon: "🖨️",
      color: "#0078D4",
      properties: [
        { name: "printerId", type: "string", isIdentifier: true },
        { name: "model", type: "string" },
        { name: "state", type: "string" },
        { name: "observedBy", type: "string" }
      ]
    },
    {
      id: "job",
      name: "Print-Job",
      description: "A print job observed in the printer queue. Grounded by queue events with timestamps; a job the queue never reported does not exist here.",
      icon: "📄",
      color: "#7719AA",
      properties: [
        { name: "jobId", type: "string", isIdentifier: true },
        { name: "pages", type: "integer" },
        { name: "state", type: "string" },
        { name: "queuedAt", type: "datetime" }
      ]
    },
    {
      id: "inventoryItem",
      name: "Inventory-Item",
      description: "A consumable tracked by the warehouse system. Grounded by stock records; the same physical toner cartridge may appear under two SKUs until identity merges them.",
      icon: "📦",
      color: "#107C10",
      properties: [
        { name: "sku", type: "string", isIdentifier: true },
        { name: "kind", type: "string" },
        { name: "stockQty", type: "integer" },
        { name: "warehouse", type: "string" }
      ]
    },
    {
      id: "location",
      name: "Location",
      description: "A place where equipment or stock is observed. Grounded by the observation that places something there — not by a directory entry.",
      icon: "📍",
      color: "#FFB900",
      properties: [
        { name: "locationId", type: "string", isIdentifier: true },
        { name: "name", type: "string" },
        { name: "building", type: "string" }
      ]
    },
    {
      id: "observation",
      name: "Observation",
      description: "The act of a source reporting something at a time. In Physis, facts exist because observations support them — this type makes that visible.",
      icon: "👁️",
      color: "#8A8886",
      properties: [
        { name: "observationId", type: "string", isIdentifier: true },
        { name: "source", type: "string" },
        { name: "observedAt", type: "datetime" },
        { name: "claim", type: "string" }
      ]
    }
  ],
  relationships: [
    {
      id: "printsOn",
      name: "prints-on",
      from: "job",
      to: "printer",
      description: "OBSERVED: the queue reported this job on this printer. The source and time are part of the fact.",
      cardinality: "many-to-many"
    },
    {
      id: "consumes",
      name: "consumes",
      from: "printer",
      to: "inventoryItem",
      description: "OBSERVED with an identity caveat: the printer reports toner use by device-local name; the warehouse uses SKUs. Physis establishes identity between the two namings before this edge is admitted.",
      cardinality: "many-to-many"
    },
    {
      id: "locatedIn",
      name: "located-in",
      from: "printer",
      to: "location",
      description: "OBSERVED: a scan or placement record puts this printer in this location.",
      cardinality: "many-to-one"
    },
    {
      id: "stockedAt",
      name: "stocked-at",
      from: "inventoryItem",
      to: "location",
      description: "OBSERVED: the warehouse record places stock at this location.",
      cardinality: "many-to-one"
    },
    {
      id: "servicableFor",
      name: "can-serve",
      from: "location",
      to: "location",
      description: "INFERRED: derived by the delivery-zone rule from stocked-at and located-in edges. The premises are named; retracting one retracts this conclusion through truth maintenance.",
      cardinality: "many-to-many"
    },
    {
      id: "supportedBy",
      name: "supported-by",
      from: "job",
      to: "observation",
      description: "PROVENANCE: links a claim to the observation that grounds it. Asking 'why does Physis believe this?' walks these edges.",
      cardinality: "many-to-many"
    }
  ]
};

export const physisWorldEntry: SampleOntologyEntry = {
  id: "physis",
  name: "Physis World Model",
  description:
    "Observations, identity and inference: the canonical Physis demo world " +
    "with sources, provenance and named derivation rules",
  icon: "🌐",
  category: "technology",
  ontology: physisOntology,
  bindings: []
};

// Instances for the Physis world. Each one names its source — the engine's
// rule is that a fact without a source is not a fact.
export const physisInstances = [
  { id: "printer-001", entityTypeId: "printer", values: { printerId: "PRT-001", model: "LaserJet Pro M404", state: "idle", observedBy: "fleet-monitor" } },
  { id: "printer-002", entityTypeId: "printer", values: { printerId: "PRT-002", model: "LaserJet Pro M404", state: "printing", observedBy: "fleet-monitor" } },
  { id: "job-001", entityTypeId: "job", values: { jobId: "JOB-1042", pages: 12, state: "queued", queuedAt: "2026-11-18T09:12:00Z" } },
  { id: "job-002", entityTypeId: "job", values: { jobId: "JOB-1043", pages: 3, state: "done", queuedAt: "2026-11-18T09:15:00Z" } },
  { id: "inv-001", entityTypeId: "inventoryItem", values: { sku: "CF258A", kind: "toner", stockQty: 4, warehouse: "WH-Verona" } },
  { id: "inv-002", entityTypeId: "inventoryItem", values: { sku: "CF258X", kind: "toner-high-cap", stockQty: 1, warehouse: "WH-Verona" } },
  { id: "loc-001", entityTypeId: "location", values: { locationId: "LOC-2F-EAST", name: "Second floor east wing", building: "HQ" } },
  { id: "loc-002", entityTypeId: "location", values: { locationId: "LOC-DESK-VERONA", name: "Verona service desk", building: "HQ" } },
  { id: "obs-001", entityTypeId: "observation", values: { observationId: "OBS-9001", source: "fleet-monitor", observedAt: "2026-11-18T09:12:05Z", claim: "JOB-1042 prints on PRT-001" } },
  { id: "obs-002", entityTypeId: "observation", values: { observationId: "OBS-9002", source: "warehouse-sync", observedAt: "2026-11-18T08:00:00Z", claim: "CF258A stocked at WH-Verona" } },
  { id: "obs-003", entityTypeId: "observation", values: { observationId: "OBS-9003", source: "placement-scan", observedAt: "2026-11-17T17:40:00Z", claim: "PRT-001 located in LOC-2F-EAST" } }
];
