// Static contract tests for /public/assets/js/taxonomy.js and content-map.js (W1.1).
// Run: npm --prefix site-tests test   (from the repository root; no emulator needed)
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  TAXONOMY_VERSION, FACETS, COVERAGE, HUB_MIN_RESOURCES, TERMS,
  NAVIGATION, BOTTOM_NAV, termBySlug, termsByFacet, isDiscoverable, normalizeTag
} from "../public/assets/js/taxonomy.js";
import {
  RESOURCE_KINDS, HUB_SECTIONS, RESOURCES, resourcesFor, derivedCoverage,
  hubEligible, hubModel, hubEligibleTerms
} from "../public/assets/js/content-map.js";

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

/** Resolve a clean URL to the file Hosting would serve (cleanUrls + trailingSlash). */
function resolveUrl(url) {
  const rel = url.replace(/^\//, "");
  const candidates = url.endsWith("/")
    ? [path.join(PUBLIC_DIR, rel, "index.html"), path.join(PUBLIC_DIR, rel.replace(/\/$/, "") + ".html")]
    : [path.join(PUBLIC_DIR, rel + ".html"), path.join(PUBLIC_DIR, rel, "index.html"), path.join(PUBLIC_DIR, rel)];
  return candidates.find((f) => existsSync(f)) || null;
}

// ---------------------------------------------------------------- taxonomy shape
test("taxonomy: version and facets are declared", () => {
  assert.equal(TAXONOMY_VERSION, 1);
  assert.deepEqual([...FACETS], ["measurement", "technology", "activity"]);
  assert.equal(HUB_MIN_RESOURCES, 3);
});

test("taxonomy: slugs are unique, lowercase, url-safe", () => {
  const seen = new Set();
  for (const t of TERMS) {
    assert.match(t.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad slug ${t.slug}`);
    assert.ok(!seen.has(t.slug), `duplicate slug ${t.slug}`);
    seen.add(t.slug);
  }
});

test("taxonomy: every term has a valid facet, label and coverage state", () => {
  const states = new Set(Object.values(COVERAGE));
  for (const t of TERMS) {
    assert.ok(FACETS.includes(t.facet), `invalid facet on ${t.slug}`);
    assert.ok(typeof t.label === "string" && t.label.length > 1, `label missing on ${t.slug}`);
    assert.ok(states.has(t.coverage), `invalid coverage on ${t.slug}`);
    assert.ok(Object.isFrozen(t), `term ${t.slug} must be frozen`);
  }
});

test("taxonomy: aliases never collide with another term's slug, label or alias", () => {
  const owner = new Map();
  const claim = (key, slug) => {
    const k = key.toLowerCase();
    assert.ok(!owner.has(k) || owner.get(k) === slug, `ambiguous alias/label "${key}" between ${owner.get(k)} and ${slug}`);
    owner.set(k, slug);
  };
  for (const t of TERMS) {
    claim(t.slug, t.slug);
    claim(t.label, t.slug);
    for (const a of t.aliases) claim(a, t.slug);
  }
});

test("taxonomy: no hub is published in W1.1 and no unsupported term can be discoverable", () => {
  for (const t of TERMS) {
    assert.equal(t.hub, null, `hub route must not exist yet for ${t.slug}`);
    assert.equal(isDiscoverable(t), false);
    if (t.coverage !== COVERAGE.SUPPORTED) assert.equal(t.hub, null);
  }
});

test("taxonomy: activities are never hub candidates", () => {
  for (const t of termsByFacet("activity")) assert.equal(hubEligible(t.slug), false);
});

// ---------------------------------------------------------------- content map
test("content-map: every resource path is unique and resolves to an existing file", () => {
  const seen = new Set();
  for (const res of RESOURCES) {
    assert.ok(!seen.has(res.path), `duplicate mapping for ${res.path}`);
    seen.add(res.path);
    assert.ok(resolveUrl(res.path), `mapped path does not exist: ${res.path}`);
    assert.ok(res.path.startsWith("/") && res.path.endsWith("/"), `path must be a clean URL with trailing slash: ${res.path}`);
  }
});

test("content-map: kinds, titles and facet references are valid", () => {
  for (const res of RESOURCES) {
    assert.ok(RESOURCE_KINDS.includes(res.kind), `invalid kind on ${res.path}`);
    assert.ok(res.title.length > 2, `title missing on ${res.path}`);
    for (const facet of FACETS) {
      for (const slug of res[facet]) {
        const t = termBySlug(slug);
        assert.ok(t, `${res.path} references unknown slug ${slug}`);
        assert.equal(t.facet, facet, `${res.path}: ${slug} is not a ${facet} term`);
      }
    }
    if (res.kind !== "index") {
      assert.ok(res.measurement.length + res.technology.length > 0, `${res.path} maps to no measurement/technology`);
    }
  }
});

test("content-map: hub sections cover every non-index kind exactly once", () => {
  const covered = HUB_SECTIONS.flatMap((s) => s.kinds);
  assert.equal(new Set(covered).size, covered.length, "a kind appears in two sections");
  for (const k of RESOURCE_KINDS.filter((k) => k !== "index")) assert.ok(covered.includes(k), `kind ${k} not placed in any hub section`);
});

test("content-map: declared coverage equals coverage derived from the mapping", () => {
  for (const t of TERMS) {
    assert.equal(t.coverage, derivedCoverage(t.slug), `${t.slug}: declared ${t.coverage}, derived ${derivedCoverage(t.slug)} (${resourcesFor(t.slug).length} resources)`);
  }
});

test("content-map: supported measurement/technology terms are exactly the hub-eligible set", () => {
  const supported = TERMS.filter((t) => t.facet !== "activity" && t.coverage === COVERAGE.SUPPORTED).map((t) => t.slug).sort();
  const eligible = hubEligibleTerms().map((t) => t.slug).sort();
  assert.deepEqual(eligible, supported);
  assert.deepEqual(supported, [
    "analytical", "flash-point-analyzer", "flow", "ftir", "gas-chromatography",
    "laboratory-qa", "pressure", "sampling-systems", "signals-loops"
  ]);
});

test("content-map: gas chromatography proves the hub contract with real content only", () => {
  const hub = hubModel("gas-chromatography");
  assert.ok(hub && hub.eligible && !hub.published && hub.hub === null);
  assert.ok(hub.resourceCount >= HUB_MIN_RESOURCES);
  for (const s of hub.sections) {
    assert.ok(s.resources.length > 0, `empty section ${s.id} must not be rendered`);
    for (const res of s.resources) assert.ok(resolveUrl(res.path), `hub resource missing on disk: ${res.path}`);
  }
  const ids = hub.sections.map((s) => s.id);
  for (const id of ["how-it-works", "components", "common-faults", "sampling-systems", "case-studies"]) assert.ok(ids.includes(id), `GC hub lacks ${id}`);
  assert.ok(!ids.includes("calibration"), "GC has no calibration page today; the section must be absent");
});

test("content-map: an uncovered technology yields no sections and is not eligible", () => {
  const hub = hubModel("zirconia-oxygen");
  assert.ok(hub);
  assert.equal(hub.eligible, false);
  assert.equal(hub.published, false);
  assert.deepEqual(hub.sections, []);
  assert.equal(hubModel("troubleshooting"), null, "activities have no hub model");
  assert.equal(hubModel("not-a-term"), null);
});

// ---------------------------------------------------------------- navigation contract
test("navigation: every destination has a valid status, and EXISTING hrefs resolve to real pages", () => {
  const groups = [NAVIGATION.solve, NAVIGATION.learn, NAVIGATION.connect];
  for (const g of groups) {
    assert.ok(["SOLVE", "LEARN", "CONNECT"].includes(g.promise));
    for (const d of g.destinations) {
      assert.ok(["existing", "w1", "future"].includes(d.status), `${d.label}: bad status`);
      if (d.status === "existing") assert.ok(resolveUrl(d.href), `${d.label}: ${d.href} does not exist`);
      if (d.status === "future") assert.equal(d.href, null, `${d.label}: future destinations carry no href`);
      if (d.status === "w1") assert.ok(d.slice, `${d.label}: w1 destination must name its slice`);
    }
  }
  for (const d of BOTTOM_NAV) {
    assert.equal(d.status, "existing");
    assert.ok(resolveUrl(d.href), `bottom nav ${d.label}: ${d.href} does not exist`);
  }
});

test("navigation: no W1 or FUTURE destination points at a page that exists (nothing future looks available)", () => {
  for (const g of [NAVIGATION.solve, NAVIGATION.learn, NAVIGATION.connect]) {
    for (const d of g.destinations) {
      if (d.status === "w1" && d.href && !d.href.includes("<")) assert.equal(resolveUrl(d.href), null, `${d.label}: w1 route already exists`);
    }
  }
});

// ---------------------------------------------------------------- tag normalisation
test("normalizeTag: deterministic exact matching, never guessing", () => {
  assert.equal(normalizeTag("GC"), "gas-chromatography");
  assert.equal(normalizeTag("#gc"), "gas-chromatography");
  assert.equal(normalizeTag("  Gas Chromatography "), "gas-chromatography");
  assert.equal(normalizeTag("4–20 mA"), "signals-loops");
  assert.equal(normalizeTag("FTIR"), "ftir");
  assert.equal(normalizeTag("zirconia"), "zirconia-oxygen");
  assert.equal(normalizeTag("gas chromatography column"), null, "partial matches are not guessed");
  assert.equal(normalizeTag("AMETEK 888"), null, "equipment names are not technology slugs");
  assert.equal(normalizeTag(""), null);
  assert.equal(normalizeTag(null), null);
  assert.equal(normalizeTag("#"), null);
});
