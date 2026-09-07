/* =========================================================
   InstMates – Existing content mapped to the taxonomy (W1.1)
   File: /assets/js/content-map.js

   Deterministic metadata for every existing technical page.
   URLs are the canonical clean URLs already served by Hosting
   (nothing is renamed, moved or duplicated). `kind` says what a
   page IS; the facet arrays say what it is ABOUT. Section index
   pages are kind "index" and never count as hub resources.

   Placeholder pages (e.g. /videos/) are intentionally NOT mapped.
========================================================= */

import { COVERAGE, HUB_MIN_RESOURCES, TERMS, termBySlug } from "./taxonomy.js";

export const RESOURCE_KINDS = Object.freeze([
  "index",           // section landing page (excluded from hub counts)
  "overview",        // technology/measurement overview article
  "explanation",     // how it works, principles, procedures explained
  "components",      // hardware, parts, wiring types
  "fault",           // failure modes, diagnostics, RCA
  "troubleshooting", // decision trees, step-by-step field guides
  "calibration",     // calibration / validation procedures
  "sampling",        // sampling & conditioning systems
  "case",            // case study
  "reference",       // standards, methods, worked examples
  "blog"             // blog article
]);

/** Hub sections and the resource kinds that populate them (plan §D). Empty sections are never rendered. */
export const HUB_SECTIONS = Object.freeze([
  Object.freeze({ id: "how-it-works", label: "How it works", kinds: ["overview", "explanation"] }),
  Object.freeze({ id: "components", label: "Components", kinds: ["components"] }),
  Object.freeze({ id: "common-faults", label: "Common faults", kinds: ["fault"] }),
  Object.freeze({ id: "troubleshooting", label: "Troubleshooting", kinds: ["troubleshooting"] }),
  Object.freeze({ id: "calibration", label: "Calibration", kinds: ["calibration"] }),
  Object.freeze({ id: "sampling-systems", label: "Sampling systems", kinds: ["sampling"] }),
  Object.freeze({ id: "case-studies", label: "Case studies", kinds: ["case"] }),
  Object.freeze({ id: "reference", label: "Reference & reading", kinds: ["reference", "blog"] })
]);

function r(path, title, kind, about = {}) {
  return Object.freeze({
    path,
    title,
    kind,
    measurement: Object.freeze(about.m || []),
    technology: Object.freeze(about.t || []),
    activity: Object.freeze(about.a || [])
  });
}

export const RESOURCES = Object.freeze([
  // ---------------- Knowledge: section indexes ----------------
  r("/knowledge/", "Knowledge Hub", "index"),
  r("/knowledge/field/", "Field Instrumentation", "index", { m: ["pressure", "flow", "signals-loops"] }),
  r("/knowledge/field/pressure/", "Pressure Measurement Fundamentals", "index", { m: ["pressure"] }),
  r("/knowledge/field/flow/", "Flow Measurement Fundamentals", "index", { m: ["flow"] }),
  r("/knowledge/field/signals/", "Instrumentation Signals", "index", { m: ["signals-loops"] }),
  r("/knowledge/field/signals/4-20ma/", "4–20 mA Signal", "index", { m: ["signals-loops"] }),
  r("/knowledge/analyzers/", "Process Analyzer Knowledge Base", "index", { m: ["analytical"], t: ["gas-chromatography", "ftir"] }),
  r("/knowledge/gc/", "Gas Chromatography (GC)", "index", { m: ["analytical"], t: ["gas-chromatography"] }),
  r("/knowledge/laboratory/", "Laboratory Analyzers", "index", { m: ["laboratory-qa"] }),

  // ---------------- Knowledge: pressure ----------------
  r("/knowledge/field/pressure/pressure-basics/", "Pressure Basics", "explanation", { m: ["pressure"] }),
  r("/knowledge/field/pressure/pressure-transmitter/", "Pressure Transmitters (PT/DP)", "components", { m: ["pressure"] }),
  r("/knowledge/field/pressure/impulse-lines/", "Impulse Lines", "explanation", { m: ["pressure"] }),
  r("/knowledge/field/pressure/manifold-valves/", "Manifold Valves", "components", { m: ["pressure"] }),
  r("/knowledge/field/pressure/pressure-calibration/", "Pressure Calibration – Field Procedure", "calibration", { m: ["pressure"], a: ["calibration"] }),
  r("/knowledge/field/pressure/pressure-failures/", "Pressure Measurement Failures – RCA Guide", "fault", { m: ["pressure"], a: ["troubleshooting"] }),
  r("/knowledge/field/pressure/pressure-troubleshooting/", "Pressure Troubleshooting – Decision Tree Guide", "troubleshooting", { m: ["pressure"], a: ["troubleshooting"] }),
  r("/knowledge/field/pressure/zero-shift-after-shutdown/", "Zero Shift After Shutdown", "troubleshooting", { m: ["pressure"], a: ["troubleshooting"] }),
  r("/knowledge/field/pressure/pressure-case-study-zero-shift/", "Case Study – Zero Shift After Maintenance", "case", { m: ["pressure"], a: ["troubleshooting"] }),

  // ---------------- Knowledge: flow ----------------
  r("/knowledge/field/flow/square-root-extraction/", "Square Root Extraction – DP Flow Scaling Explained", "explanation", { m: ["flow"] }),
  r("/knowledge/field/flow/impulse-lines/", "Impulse Line Installation – DP Flow Accuracy", "explanation", { m: ["flow"] }),
  r("/knowledge/field/flow/manifold-valves/", "Manifold Valves & Equalization Logic", "components", { m: ["flow"] }),
  r("/knowledge/field/flow/dp-flow-troubleshooting/", "DP Flow Troubleshooting – Complete Field Guide", "troubleshooting", { m: ["flow"], a: ["troubleshooting"] }),

  // ---------------- Knowledge: signals & loops ----------------
  r("/knowledge/field/signals/4-20ma/420ma-basics/", "4–20 mA Basics", "explanation", { m: ["signals-loops"] }),
  r("/knowledge/field/signals/4-20ma/live-zero/", "Live Zero & NAMUR", "explanation", { m: ["signals-loops"] }),
  r("/knowledge/field/signals/4-20ma/loop-wiring/", "4–20 mA Loop Wiring", "components", { m: ["signals-loops"] }),
  r("/knowledge/field/signals/4-20ma/wiring-types/", "4–20 mA Wiring – 2-Wire vs 3-Wire vs 4-Wire", "components", { m: ["signals-loops"] }),
  r("/knowledge/field/signals/4-20ma/scaling-calculation/", "4–20 mA Scaling & Calculation", "explanation", { m: ["signals-loops"] }),
  r("/knowledge/field/signals/4-20ma/calibration/", "4–20 mA Calibration Procedure", "calibration", { m: ["signals-loops"], a: ["calibration"] }),
  r("/knowledge/field/signals/4-20ma/loop-check-vs-bench-calibration/", "Loop Check vs Bench Calibration", "calibration", { m: ["signals-loops"], a: ["calibration"] }),
  r("/knowledge/field/signals/4-20ma/diagnostics/", "4–20 mA Diagnostics & Faults", "fault", { m: ["signals-loops"], a: ["troubleshooting"] }),
  r("/knowledge/field/signals/4-20ma/troubleshooting/", "4–20 mA Troubleshooting – Master Guide", "troubleshooting", { m: ["signals-loops"], a: ["troubleshooting"] }),
  r("/knowledge/field/signals/4-20ma/case-study/", "4–20 mA Field Case Study", "case", { m: ["signals-loops"], a: ["troubleshooting"] }),
  r("/knowledge/field/signals/hart/", "HART Communication Protocol", "explanation", { m: ["signals-loops"] }),
  r("/knowledge/field/wiring-grounding/", "Field Wiring & Grounding", "explanation", { m: ["signals-loops"] }),

  // ---------------- Knowledge: gas chromatography ----------------
  r("/knowledge/gc/gc-basics/", "GC Basics", "overview", { m: ["analytical"], t: ["gas-chromatography"] }),
  r("/knowledge/analyzers/gc-basics/", "Gas Chromatograph (GC) – Working Principle, Components & Field Troubleshooting", "overview", { m: ["analytical"], t: ["gas-chromatography"] }),
  r("/knowledge/analyzers/gc-components/", "Gas Chromatograph (GC) Components", "components", { m: ["analytical"], t: ["gas-chromatography"] }),
  r("/knowledge/gc/gc-column-types/", "GC Column Types", "components", { m: ["analytical"], t: ["gas-chromatography"] }),
  r("/knowledge/gc/gc-6port-valve/", "GC 6-Port Sampling Valve", "components", { m: ["analytical"], t: ["gas-chromatography", "sampling-systems"] }),
  r("/knowledge/gc/gc-backflush/", "GC Backflush Operation", "explanation", { m: ["analytical"], t: ["gas-chromatography"] }),
  r("/knowledge/gc/gc-heartcut/", "GC Heart-Cut (Dual Column)", "explanation", { m: ["analytical"], t: ["gas-chromatography"] }),
  r("/knowledge/gc/gc-timing-chromatogram/", "GC Timing vs Chromatogram", "explanation", { m: ["analytical"], t: ["gas-chromatography"] }),
  r("/knowledge/gc/gc-full-cycle/", "GC Full Cycle Timeline", "explanation", { m: ["analytical"], t: ["gas-chromatography"], a: ["preventive-maintenance"] }),
  r("/knowledge/gc/gc-failure-modes/", "GC Failure Modes", "fault", { m: ["analytical"], t: ["gas-chromatography"], a: ["troubleshooting", "preventive-maintenance"] }),
  r("/knowledge/gc/gc-sampling-system/", "GC Sampling System", "sampling", { m: ["analytical"], t: ["gas-chromatography", "sampling-systems"] }),
  r("/knowledge/analyzers/gc-sampling-system/", "GC Sampling System – Design, Pressure Stability & Field Troubleshooting", "sampling", { m: ["analytical"], t: ["gas-chromatography", "sampling-systems"] }),

  // ---------------- Knowledge: FTIR ----------------
  r("/knowledge/analyzers/ftir-analyzer/", "FTIR Analyzer – Working Principle, Components & Field Troubleshooting", "overview", { m: ["analytical"], t: ["ftir"] }),
  r("/knowledge/analyzers/ftir-calibration-validation/", "FTIR Calibration & Validation – Zero, Span & Moisture Control", "calibration", { m: ["analytical"], t: ["ftir"], a: ["calibration"] }),
  r("/knowledge/analyzers/ftir-moisture-cross-interference/", "FTIR Moisture & Cross-Interference – Field Troubleshooting Guide", "troubleshooting", { m: ["analytical"], t: ["ftir", "moisture"], a: ["troubleshooting"] }),
  r("/knowledge/analyzers/ftir-sampling-system/", "FTIR Sampling System – Design, Dew Point Control & Troubleshooting", "sampling", { m: ["analytical"], t: ["ftir", "sampling-systems"] }),

  // ---------------- Knowledge: laboratory & QA ----------------
  r("/knowledge/laboratory/calibration-master-guide/", "Laboratory Analyzer Calibration – Master Technical Guide", "calibration", { m: ["laboratory-qa"], a: ["calibration"] }),
  r("/knowledge/laboratory/bias-linearity-lod-loq/", "Bias vs Linearity vs LOD & LOQ", "reference", { m: ["laboratory-qa"], a: ["reliability"] }),
  r("/knowledge/laboratory/rsd-accuracy-precision/", "RSD%, Accuracy & Precision", "reference", { m: ["laboratory-qa"], a: ["reliability"] }),
  r("/knowledge/laboratory/measurement-uncertainty/", "Measurement Uncertainty – Laboratory Technical Guide", "reference", { m: ["laboratory-qa"], a: ["reliability"] }),
  r("/knowledge/laboratory/measurement-uncertainty/worked-example/", "Measurement Uncertainty – Full Worked Numerical Example", "reference", { m: ["laboratory-qa"], a: ["reliability"] }),
  r("/knowledge/laboratory/control-charts-spc/", "Control Charts & Statistical Process Control (SPC)", "reference", { m: ["laboratory-qa"], a: ["reliability"] }),
  r("/knowledge/laboratory/control-charts-spc/worked-example/", "Control Chart Worked Example", "reference", { m: ["laboratory-qa"], a: ["reliability"] }),
  r("/knowledge/laboratory/iso-17025-clause-breakdown/", "ISO 17025 Clause-by-Clause Technical Breakdown", "reference", { m: ["laboratory-qa"], a: ["standards-compliance"] }),
  r("/knowledge/laboratory/iso-17025-audit-preparation/", "ISO 17025 Audit Preparation", "reference", { m: ["laboratory-qa"], a: ["standards-compliance"] }),
  r("/knowledge/laboratory/flash-point-analyzer/", "Flash Point Analyzer – Principle, ASTM Methods & Troubleshooting", "overview", { m: ["laboratory-qa", "analytical"], t: ["flash-point-analyzer"] }),
  r("/knowledge/laboratory/flash-point-analyzer/astm-d56/", "ASTM D56 – Tag Closed Cup Flash Point Method", "reference", { m: ["laboratory-qa"], t: ["flash-point-analyzer"], a: ["standards-compliance"] }),
  r("/knowledge/laboratory/flash-point-analyzer/astm-d93/", "ASTM D93 – Pensky-Martens Flash Point Method", "reference", { m: ["laboratory-qa"], t: ["flash-point-analyzer"], a: ["standards-compliance"] }),
  r("/knowledge/laboratory/flash-point-analyzer/troubleshooting/", "Flash Point Analyzer – Troubleshooting Decision Tree", "troubleshooting", { m: ["laboratory-qa"], t: ["flash-point-analyzer"], a: ["troubleshooting"] }),

  // ---------------- Case studies ----------------
  r("/case-studies/", "Analyzer & Instrumentation Case Studies", "index"),
  r("/case-studies/analyzers/", "Analyzer Case Studies", "index", { m: ["analytical"] }),
  r("/case-studies/analyzers/yokogawa/", "Yokogawa Analyzer Case Studies", "index", { m: ["analytical"], t: ["gas-chromatography"] }),
  r("/case-studies/analyzers/yokogawa/gc8000/", "GC8000 Error Codes (600–699)", "index", { m: ["analytical"], t: ["gas-chromatography"] }),
  r("/case-studies/analyzers/yokogawa/gc8000/error-602-slow-oven-warmup/", "Yokogawa GC8000 Error 602 – Slow Oven Warm-Up", "case", { m: ["analytical"], t: ["gas-chromatography"], a: ["troubleshooting"] }),
  r("/case-studies/analyzers/yokogawa/gc8000/error-603-oven-failure/", "Yokogawa GC8000 Error 603 – Oven Heater Failure", "case", { m: ["analytical"], t: ["gas-chromatography"], a: ["troubleshooting"] }),
  r("/case-studies/analyzers/yokogawa/gc8000/error-604-oven-overtemperature/", "Yokogawa GC8000 Error 604 – Oven Overtemperature", "case", { m: ["analytical"], t: ["gas-chromatography"], a: ["troubleshooting"] }),
  r("/case-studies/analyzers/yokogawa/gc8000/error-605-carrier-gas-low-pressure/", "Yokogawa GC8000 Error 605 – Carrier Gas Low Pressure", "case", { m: ["analytical"], t: ["gas-chromatography"], a: ["troubleshooting"] }),
  r("/case-studies/gc-baseline-drift/", "GC Baseline Drift After Calibration", "case", { m: ["analytical"], t: ["gas-chromatography"], a: ["troubleshooting", "calibration"] }),
  r("/case-studies/rosemount-3051-zero-shift/", "Emerson Rosemount 3051 Zero Shift After Shutdown", "case", { m: ["pressure"], a: ["troubleshooting"] }),
  r("/case-studies/emerson-rosemount-3414-3417-wet-leg-zero-shift/", "Emerson Rosemount 3414/3417 – Wet Leg Zero Shift", "case", { m: ["pressure", "level"], a: ["troubleshooting"] }),
  r("/case-studies/krohne-altosonic-v12-velocity-mismatch/", "KROHNE ALTOSONIC V12 – Velocity Path Mismatch", "case", { m: ["flow"], a: ["troubleshooting"] }),

  // ---------------- Blog ----------------
  r("/blog/", "Instrumentation Blog", "index"),
  r("/blog/common-4-20ma-mistakes/", "5 Common 4–20 mA Mistakes in Field Instrumentation", "blog", { m: ["signals-loops"], a: ["troubleshooting"] }),
  r("/blog/why-4-20ma-live-zero/", "Why 4–20 mA Uses Live Zero Instead of 0 mA", "blog", { m: ["signals-loops"] }),
  r("/blog/loop-check-vs-calibration-explained/", "Loop Check vs Calibration – What Most Technicians Get Wrong", "blog", { m: ["signals-loops"], a: ["calibration"] })
]);

/* ---------------- Pure query helpers ---------------- */

const FACET_KEY = Object.freeze({ measurement: "measurement", technology: "technology", activity: "activity" });

function facetOf(slug) {
  const t = termBySlug(slug);
  return t ? t.facet : null;
}

/** Content resources (kind !== "index") about a taxonomy slug, in declaration order. */
export function resourcesFor(slug) {
  const facet = facetOf(slug);
  if (!facet) return [];
  const key = FACET_KEY[facet];
  return RESOURCES.filter((res) => res.kind !== "index" && res[key].includes(slug));
}

/** Coverage derived purely from the mapping; must equal the declared coverage in taxonomy.js. */
export function derivedCoverage(slug) {
  const n = resourcesFor(slug).length;
  if (n >= HUB_MIN_RESOURCES) return COVERAGE.SUPPORTED;
  if (n > 0) return COVERAGE.PARTIAL;
  return COVERAGE.NONE;
}

/** Hub publication rule (plan §D): at least HUB_MIN_RESOURCES real content resources. Activities are filters, never hubs. */
export function hubEligible(slug) {
  const t = termBySlug(slug);
  if (!t || t.facet === "activity") return false;
  return resourcesFor(slug).length >= HUB_MIN_RESOURCES;
}

/**
 * Deterministic hub model for a technology or measurement slug.
 * Returns only non-empty sections. `published` is false for every term in W1.1
 * because no hub routes exist yet; `eligible` says whether the content rule is met.
 */
export function hubModel(slug) {
  const t = termBySlug(slug);
  if (!t || t.facet === "activity") return null;
  const resources = resourcesFor(slug);
  const sections = HUB_SECTIONS
    .map((s) => ({ id: s.id, label: s.label, resources: resources.filter((res) => s.kinds.includes(res.kind)) }))
    .filter((s) => s.resources.length > 0);
  return Object.freeze({
    slug,
    label: t.label,
    facet: t.facet,
    coverage: t.coverage,
    resourceCount: resources.length,
    eligible: resources.length >= HUB_MIN_RESOURCES,
    published: t.hub !== null,
    hub: t.hub,
    sections: Object.freeze(sections)
  });
}

/** Terms whose hub would be eligible today (content rule only; publication is a separate decision). */
export function hubEligibleTerms() {
  return TERMS.filter((t) => hubEligible(t.slug));
}

/** W1.2: the mapped resource a term's declared LEARN entry point opens, or null. */
export function entryResource(slug) {
  const t = termBySlug(slug);
  if (!t || !t.entry) return null;
  return RESOURCES.find((res) => res.path === t.entry) || null;
}

/** W1.2: content resources (index pages excluded) whose path starts with a section prefix. */
export function resourcesUnder(prefix) {
  return RESOURCES.filter((res) => res.kind !== "index" && res.path.startsWith(prefix));
}

/** W1.3: resolve a browser pathname (clean URL, .html or index.html form) to its mapped resource, or null. */
export function resourceForPath(pathname) {
  let p = String(pathname || "").split(/[?#]/)[0];
  p = p.replace(/\/index\.html$/, "/").replace(/\.html$/, "/");
  if (!p.endsWith("/")) p += "/";
  return RESOURCES.find((res) => res.path === p) || null;
}

export const RELATED_LIMIT = 6;

/**
 * W1.3 related-knowledge rule (deterministic, bounded):
 * primary term = first technology term, else first measurement term.
 * Candidates = content resources of that term, never the page itself, never index pages.
 * Order: round-robin across the OTHER hub sections (HUB_SECTIONS order, RESOURCES order
 * inside a section) so a reader sees one item per section before a second of any,
 * then the page's own section. Truncated to RELATED_LIMIT.
 */
export function relatedResources(res, limit = RELATED_LIMIT) {
  if (!res || res.kind === "index") return [];
  const primary = res.technology[0] || res.measurement[0] || null;
  if (!primary) return [];
  const sectionOf = (r) => HUB_SECTIONS.findIndex((s) => s.kinds.includes(r.kind));
  const mine = sectionOf(res);
  const candidates = resourcesFor(primary).filter((r) => r.path !== res.path);
  const buckets = HUB_SECTIONS.map((_, i) => candidates.filter((r) => sectionOf(r) === i));
  const order = [...buckets.keys()].filter((i) => i !== mine).concat(mine >= 0 ? [mine] : []);
  const out = [];
  for (let round = 0; out.length < limit; round++) {
    let added = false;
    for (const i of order) {
      const r = buckets[i][round];
      if (!r) continue;
      added = true;
      // Two mapped pages can share a title (e.g. the GC basics overview in two sections); show one.
      if (out.some((x) => x.title === r.title)) continue;
      out.push(r);
      if (out.length >= limit) break;
    }
    if (!added) break;
  }
  return out;
}
