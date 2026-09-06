/* =========================================================
   InstMates – Static controlled vocabulary (W1.1)
   File: /assets/js/taxonomy.js

   Single source of truth for the three-facet taxonomy and the
   SOLVE / LEARN / CONNECT navigation contract defined in
   docs/17-w1-product-experience-plan.md.

   - Pure data + pure functions. No Firestore, no DOM, no fetch.
   - Importable by the site's ES modules and by node:test.
   - Coverage is DECLARED here for deterministic UI use and is
     VERIFIED against content-map.js by site-tests (the two must agree).
   - A term is discoverable only when it has a published hub route
     (`hub` !== null). In W1.1 no hub routes exist, so nothing is
     discoverable; unsupported terms can never receive a hub.
   - Shape is intentionally document-like so it can later be stored
     as a server-managed document without changing consumers.
========================================================= */

export const TAXONOMY_VERSION = 1;

export const FACETS = Object.freeze(["measurement", "technology", "activity"]);

export const COVERAGE = Object.freeze({
  SUPPORTED: "supported", // >= HUB_MIN_RESOURCES real content resources
  PARTIAL: "partial",     // 1..HUB_MIN_RESOURCES-1 resources
  NONE: "none"            // no content yet
});

/** Minimum real content resources before a technology/measurement hub may be published. */
export const HUB_MIN_RESOURCES = 3;

function term(facet, slug, label, extra = {}) {
  return Object.freeze({
    facet,
    slug,
    label,
    group: extra.group || null,
    aliases: Object.freeze(extra.aliases || []),
    coverage: extra.coverage || COVERAGE.NONE,
    hub: null, // no hub routes are published in W1.1 (see plan §D)
    note: extra.note || null
  });
}

export const TERMS = Object.freeze([
  // ---------- Facet 1: MEASUREMENT (what is measured) ----------
  term("measurement", "pressure", "Pressure", { aliases: ["pt", "dp", "pressure transmitter"], coverage: "supported" }),
  term("measurement", "flow", "Flow", { aliases: ["dp flow", "flow measurement", "flowmeter"], coverage: "supported" }),
  term("measurement", "level", "Level", { aliases: ["level measurement", "wet leg"], coverage: "partial", note: "One case study (wet-leg zero shift); no dedicated pages yet." }),
  term("measurement", "temperature", "Temperature", { aliases: ["rtd", "thermocouple"], coverage: "none" }),
  term("measurement", "signals-loops", "Signals & loops", { aliases: ["4-20ma", "4–20 ma", "4-20 ma", "hart", "loop", "wiring", "grounding"], coverage: "supported" }),
  term("measurement", "analytical", "Analytical", { aliases: ["analyzer", "analyzers", "process analyzer"], coverage: "supported", note: "Umbrella for the analytical technologies in facet 2." }),
  term("measurement", "control-valves", "Control valves", { aliases: ["valve", "positioner"], coverage: "none" }),
  term("measurement", "process-control", "Process control", { aliases: ["pid", "control loop"], coverage: "none" }),
  term("measurement", "laboratory-qa", "Laboratory & QA", { aliases: ["laboratory", "lab", "qa", "iso 17025"], coverage: "supported" }),

  // ---------- Facet 2: ANALYTICAL TECHNOLOGY (how it is measured) ----------
  term("technology", "gas-chromatography", "Gas chromatography", { group: "gas", aliases: ["gc", "gas chromatograph", "chromatograph"], coverage: "supported" }),
  term("technology", "ftir", "FTIR", { group: "gas", aliases: ["ft-ir", "fourier transform infrared"], coverage: "supported" }),
  term("technology", "sampling-systems", "Sampling systems", { group: "cross-cutting", aliases: ["sample conditioning", "sampling system", "sample system"], coverage: "supported" }),
  term("technology", "flash-point-analyzer", "Flash-point analyzer", { group: "laboratory", aliases: ["flash point", "astm d56", "astm d93"], coverage: "supported" }),
  term("technology", "moisture", "Moisture analyzers", { group: "gas", aliases: ["dew point", "humidity analyzer"], coverage: "partial", note: "Only the FTIR moisture cross-interference guide." }),
  term("technology", "zirconia-oxygen", "Zirconia oxygen", { group: "oxygen", aliases: ["zirconia", "zirconia o2", "zro2"], coverage: "none" }),
  term("technology", "paramagnetic-oxygen", "Paramagnetic oxygen", { group: "oxygen", aliases: ["paramagnetic", "paramagnetic o2"], coverage: "none" }),
  term("technology", "electrochemical-oxygen", "Electrochemical oxygen", { group: "oxygen", aliases: ["electrochemical o2", "galvanic o2"], coverage: "none" }),
  term("technology", "ndir", "NDIR / IR gas analyzers", { group: "gas", aliases: ["ndir analyzer", "infrared gas analyzer"], coverage: "none" }),
  term("technology", "uv", "UV analyzers", { group: "gas", aliases: ["uv analyzer", "ultraviolet analyzer"], coverage: "none" }),
  term("technology", "h2s", "H2S analyzers", { group: "gas", aliases: ["hydrogen sulfide", "hydrogen sulphide"], coverage: "none" }),
  term("technology", "so2", "SO2 analyzers", { group: "gas", aliases: ["sulfur dioxide", "sulphur dioxide"], coverage: "none" }),
  term("technology", "nox", "NOx analyzers", { group: "gas", aliases: ["nitrogen oxides", "chemiluminescence"], coverage: "none" }),
  term("technology", "cems", "CEMS", { group: "gas", aliases: ["continuous emissions monitoring", "emissions monitoring"], coverage: "none" }),
  term("technology", "ph", "pH analyzers", { group: "liquid", aliases: ["ph analyzer", "ph sensor"], coverage: "none" }),
  term("technology", "conductivity", "Conductivity analyzers", { group: "liquid", aliases: ["conductivity analyzer"], coverage: "none" }),
  term("technology", "silica", "Silica analyzers", { group: "liquid", aliases: ["silica analyzer"], coverage: "none" }),
  term("technology", "sodium", "Sodium analyzers", { group: "liquid", aliases: ["sodium analyzer"], coverage: "none" }),
  term("technology", "toc", "TOC analyzers", { group: "liquid", aliases: ["total organic carbon"], coverage: "none" }),
  term("technology", "swas", "SWAS", { group: "liquid", aliases: ["steam and water analysis", "steam water analysis system"], coverage: "none" }),

  // ---------- Facet 3: PROFESSIONAL ACTIVITY (what the professional is doing) ----------
  term("activity", "troubleshooting", "Troubleshooting", { aliases: ["fault finding", "diagnostics", "rca"], coverage: "supported" }),
  term("activity", "calibration", "Calibration", { aliases: ["loop check", "span", "zero"], coverage: "supported" }),
  term("activity", "preventive-maintenance", "Preventive maintenance", { aliases: ["pm", "maintenance"], coverage: "partial" }),
  term("activity", "commissioning", "Commissioning", { aliases: ["start-up", "startup"], coverage: "none" }),
  term("activity", "reliability", "Reliability & measurement quality", { aliases: ["spc", "uncertainty", "precision"], coverage: "supported" }),
  term("activity", "standards-compliance", "Standards & compliance", { aliases: ["standards", "iso", "astm", "audit"], coverage: "supported" })
]);

/* ---------------- Navigation contract (consumed by W1.2; not rendered in W1.1) ----------------
   status: "existing" = the destination resolves to a page on main today
           "w1"       = planned for a W1 slice; must not be rendered as available before it exists
           "future"   = capability that does not exist; never rendered as available
   Labels are PROPOSED (plan §Q); hrefs for "existing" entries are verified by site-tests. */
function dest(label, href, status, extra = {}) {
  return Object.freeze({ label, href, status, auth: !!extra.auth, slice: extra.slice || null, note: extra.note || null });
}

export const NAVIGATION = Object.freeze({
  solve: Object.freeze({
    promise: "SOLVE",
    question: "What problem are you working on?",
    destinations: Object.freeze([
      dest("4–20 mA troubleshooting", "/knowledge/field/signals/4-20ma/troubleshooting/", "existing"),
      dest("Pressure troubleshooting", "/knowledge/field/pressure/pressure-troubleshooting/", "existing"),
      dest("Zero shift after shutdown", "/knowledge/field/pressure/zero-shift-after-shutdown/", "existing"),
      dest("DP flow troubleshooting", "/knowledge/field/flow/dp-flow-troubleshooting/", "existing"),
      dest("GC failure modes", "/knowledge/gc/gc-failure-modes/", "existing"),
      dest("FTIR moisture & cross-interference", "/knowledge/analyzers/ftir-moisture-cross-interference/", "existing"),
      dest("Flash-point analyzer troubleshooting", "/knowledge/laboratory/flash-point-analyzer/troubleshooting/", "existing"),
      dest("Case studies", "/case-studies/", "existing"),
      dest("Ask about your fault", "/feed/", "existing", { auth: true, note: "Posting requires login; composer prefill (type=fault) is a W1.5 item." }),
      dest("Solve landing page", "/solve/", "w1", { slice: "W1.2", note: "Homepage SOLVE block first; a dedicated route only if W1.2 needs it." })
    ])
  }),
  learn: Object.freeze({
    promise: "LEARN",
    question: "Understand the measurement or technology.",
    destinations: Object.freeze([
      dest("Knowledge Hub", "/knowledge/", "existing"),
      dest("Field instrumentation", "/knowledge/field/", "existing"),
      dest("Process analyzers", "/knowledge/analyzers/", "existing"),
      dest("Gas chromatography", "/knowledge/gc/", "existing"),
      dest("Laboratory & QA", "/knowledge/laboratory/", "existing"),
      dest("Technologies index", "/technology/", "w1", { slice: "W1.4" }),
      dest("Technology hubs", "/technology/<slug>/", "w1", { slice: "W1.4", note: "Only for terms with coverage=supported; empty sections never rendered." })
    ])
  }),
  connect: Object.freeze({
    promise: "CONNECT",
    question: "Find real cases, discussions and professionals with relevant experience.",
    destinations: Object.freeze([
      dest("Discussions", "/feed/", "existing"),
      dest("Case studies", "/case-studies/", "existing"),
      dest("People (public directory)", "/profiles/", "existing"),
      dest("Your profile", "/profile/", "existing", { auth: true }),
      dest("Contribute (post a solution)", "/feed/", "existing", { auth: true }),
      dest("People by technology", null, "future", { note: "Requires the people↔technology mapping design (plan §F)." }),
      dest("Messaging", null, "future"),
      dest("Follow / save", null, "future")
    ])
  })
});

/** PROPOSED mobile bottom navigation (plan §K). Not rendered in W1.1. */
export const BOTTOM_NAV = Object.freeze([
  dest("Solve", "/knowledge/field/signals/4-20ma/troubleshooting/", "existing", { note: "Interim target until a SOLVE surface exists (W1.2)." }),
  dest("Learn", "/knowledge/", "existing"),
  dest("Connect", "/feed/", "existing"),
  dest("Account", "/profile/", "existing", { auth: true })
]);

/* ---------------- Pure helpers ---------------- */

const BY_SLUG = new Map(TERMS.map((t) => [t.slug, t]));

export function termBySlug(slug) {
  return BY_SLUG.get(slug) || null;
}

export function termsByFacet(facet) {
  return TERMS.filter((t) => t.facet === facet);
}

/** A term is publicly discoverable only when it has a published hub route. */
export function isDiscoverable(t) {
  return !!t && t.coverage === COVERAGE.SUPPORTED && t.hub !== null;
}

export function normalizeText(raw) {
  return String(raw ?? "")
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/[–—]/g, "-") // en/em dash -> hyphen
    .replace(/\s+/g, " ")
    .trim();
}

const ALIAS_INDEX = (() => {
  const m = new Map();
  for (const t of TERMS) {
    m.set(normalizeText(t.slug), t.slug);
    m.set(normalizeText(t.label), t.slug);
    for (const a of t.aliases) m.set(normalizeText(a), t.slug);
  }
  return m;
})();

/**
 * Deterministic, read-only mapping of a free-text tag to a taxonomy slug.
 * Exact match on slug, label or alias after normalisation; otherwise null.
 * Never mutates data; never guesses on partial matches.
 */
export function normalizeTag(raw) {
  const key = normalizeText(raw);
  if (!key) return null;
  return ALIAS_INDEX.get(key) || null;
}
