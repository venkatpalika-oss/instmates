# W1.1 — Taxonomy + navigation contract: implementation notes

**Slice:** W1.1 of the W1 product contract ([17-w1-product-experience-plan.md](17-w1-product-experience-plan.md)). Static foundation only; no page, style, header, Firebase, rules, index or data changes.

## What was built

| Artifact | Purpose |
|---|---|
| `public/assets/js/taxonomy.js` | One canonical ES module: the three facets, every term with slug/label/group/aliases/declared coverage/hub route, the SOLVE · LEARN · CONNECT navigation contract, the PROPOSED bottom-nav contract, and pure helpers (`termBySlug`, `termsByFacet`, `isDiscoverable`, `normalizeTag`). |
| `public/assets/js/content-map.js` | Deterministic metadata for every existing technical page (79 resources: knowledge, case studies, blog; placeholder video pages excluded): canonical clean URL, title, `kind`, and the measurement/technology/activity slugs it is about. Pure helpers `resourcesFor`, `derivedCoverage`, `hubEligible`, `hubModel`, `hubEligibleTerms`. |
| `site-tests/` | `node --test` contract suite (no emulator, no network): 16 tests. Run `npm --prefix site-tests test` from the repository root. |

Nothing imports these modules yet. They are served as static files like the rest of `assets/js/` but no page references them, so production behaviour is unchanged.

## Taxonomy representation

- A frozen array of term objects, one module, no duplicated definitions; consumers import `TERMS` or the helpers.
- Fields: `facet`, `slug`, `label`, `group` (technology grouping: gas / liquid / oxygen / cross-cutting / laboratory), `aliases`, `coverage` (`supported` / `partial` / `none`), `hub` (published route or `null`), `note`.
- **Coverage is declared in `taxonomy.js` and verified against `content-map.js` by tests**: `supported` ⇔ ≥3 real content resources, `partial` ⇔ 1–2, `none` ⇔ 0. The two files cannot drift silently.
- **Discoverability** = `coverage === "supported"` **and** a published hub route. In W1.1 every `hub` is `null`; unsupported terms can never receive one (tested).
- The object is shaped like a document so it can later be served from a server-managed source without changing consumers.

## Coverage today (derived from the mapping, index pages excluded)

| Facet | Supported (≥3) | Partial (1–2) | None |
|---|---|---|---|
| Measurement | pressure (11), flow (5), signals-loops (15), analytical (22), laboratory-qa (13) | level (1) | temperature, control-valves, process-control |
| Technology | gas-chromatography (17), ftir (4), sampling-systems (4), flash-point-analyzer (4) | moisture (1) | zirconia/paramagnetic/electrochemical oxygen, ndir, uv, h2s, so2, nox, cems, ph, conductivity, silica, sodium, toc, swas |
| Activity | troubleshooting (20), calibration (7), reliability (6), standards-compliance (4) | preventive-maintenance (2) | commissioning |

Differences from the plan's PROPOSED matrix (§E), explained by the mapping evidence: **level** is `partial` (the wet-leg zero-shift case study), and **reliability** is `supported` because uncertainty, RSD/precision, LOD/LOQ and SPC pages are mapped to it as measurement-quality reliability. Neither creates a hub.

## Mapping strategy

- Metadata over restructuring: URLs are the canonical clean URLs already served; nothing renamed, moved or duplicated. Each page is mapped once (tested).
- `kind` says what a page is (`overview`, `explanation`, `components`, `fault`, `troubleshooting`, `calibration`, `sampling`, `case`, `reference`, `blog`, `index`); the facet arrays say what it is about. Section landing pages are `index` and never count toward hubs.
- Questions the map answers today: `resourcesFor("gas-chromatography")` (17 pages), `resourcesFor("troubleshooting")` (20), `resourcesFor("flow")` filtered to `kind === "case"` (1), `hubModel(slug)` for hub population. Totals: 79 mapped pages, 65 content resources, 14 section indexes.

## Hub publication rule and the prototype decision

- A technology or measurement hub is eligible only with **≥3 real content resources** (`HUB_MIN_RESOURCES`); activities are filters, never hubs; empty sections are omitted from `hubModel` output, so they can never be rendered.
- **No prototype route was created.** The contract is proven by tests on the deterministic model: `hubModel("gas-chromatography")` yields 17 resources across How-it-works, Components, Common faults, Sampling systems and Case studies, and correctly omits Calibration (no GC calibration page exists); `hubModel("zirconia-oxygen")` yields no sections and is not eligible. A route would have added a production-facing page without adding proof, so it was not needed.
- Eligible today (content rule only; publication is a W1.4 decision): analytical, flash-point-analyzer, flow, ftir, gas-chromatography, laboratory-qa, pressure, sampling-systems, signals-loops.

## Navigation contract

`NAVIGATION` maps SOLVE / LEARN / CONNECT to destinations with `status` `existing` (resolves to a page on `main`, verified by tests), `w1` (names its slice; must not be rendered as available), or `future` (no href). The production header, footer and bottom nav are **unchanged** in W1.1; W1.2 consumes this model. Labels are PROPOSED.

## Profile / `analyzersWorked` limitation (FUTURE)

`analyzersWorked` records **equipment experience** ("AMETEK 888", "Siemens Maxum II"); the taxonomy records **technology** (`zirconia-oxygen`, `gas-chromatography`). They are different things. W1.1 does not read, modify, backfill or reinterpret profile documents, adds no field, and changes no rules or indexes. The people↔technology mapping needs its own design (equipment→technology reference, or a member-chosen field with a rules change) and its own authorization. `normalizeTag("AMETEK 888")` returns `null` by design.

## Post-tag limitation

Tags are free text, comma-split, unnormalised, at most five per post. The three production posts carry `[]`, `null`, `null`, and one legacy post has no `type`. `normalizeTag` is deterministic and read-only (exact match on slug/label/alias after lower-casing, trimming, `#` and dash normalisation; anything else → `null`). No post is rewritten and no tags are backfilled. Writing a slug from the composer is a W1.5 decision.

## Scale review triggers (REVIEW HEURISTIC, not thresholds)

Client-side filtering stays until read-only measurements — payload per page, Firestore reads per view, query latency, client filtering time on a mid-range phone, Core Web Vitals, rail response time, monthly read cost — show degradation against the field-use targets. Then composite indexes are proposed as a separate infrastructure change with the measurements attached.

## Interactions that would eventually need measurement (no analytics change in W1.1)

Technology-index clicks by term and coverage state; SOLVE entry clicks; hub section clicks; article → hub breadcrumb clicks; discussions-rail clicks; "ask about this fault" starts. Sitewide analytics is a separate owner decision.
