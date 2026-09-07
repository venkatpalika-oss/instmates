# W1.3 — Gas chromatography discovery slice: implementation notes

**Branch:** `feature/w1-3-gc-discovery` from main cea6ce5. Local implementation of the W1.3 audit contract: the first evidence-backed technology hub, related-knowledge links, a hub→composer contribute path, and author→profile links. No rules, indexes, schema, Functions, backend or production-data change; no other hubs; no `/technology/` index; no `/solve/`; no search; no people-by-technology.

## Why GC qualifies

The canonical content map (`content-map.js`, `hubModel("gas-chromatography")`) yields **17 content resources** (index pages excluded) across five non-empty sections, far above `HUB_MIN_RESOURCES = 3`. It is the deepest technology cluster on the site and already had a knowledge index, four vendor error-code cases and a baseline-drift case.

## Published sections (from the model, regenerated at build time)

| # | Section | Resources |
|---|---|---|
| 01 | How it works | 6 (GC basics ×2, backflush, heart-cut, timing/chromatogram, full cycle) |
| 02 | Components | 3 (components, column types, 6-port valve) |
| 03 | Common faults | 1 (GC failure modes) |
| 04 | Sampling systems | 2 |
| 05 | Case studies | 5 (GC8000 602/603/604/605, baseline drift) |

Then **06 Community** (honest state) and **07 Contribute**.

## Intentionally absent

Troubleshooting (the failure-modes page is canonically a `fault` resource and stays under Common faults; no separate troubleshooting page exists), Calibration (no GC calibration page), Reference & reading (no GC reference/blog page), People (see below). Sections are rendered only when `hubModel` returns resources for them; the generator cannot emit an empty section.

## Architecture

- `scripts/build-hub.mjs` renders `public/technology/<slug>/index.html` from the model for every term whose taxonomy entry declares `hub`. The output is committed (static Hosting); `site-tests/hub.test.mjs` re-renders and asserts byte equality, so the page can never drift from the model. `--check` reports drift.
- `taxonomy.js`: `hub` is now `extra.hub || null`; only `gas-chromatography` declares `/technology/gas-chromatography/`. `isDiscoverable` is therefore true for GC alone (tested).
- Hub page: breadcrumb, numbered sections with monospace metadata and rule lines (first restrained use of the technical-drawing direction, scoped to `.hub`), BreadcrumbList + CollectionPage JSON-LD (`hasPart` = the 17 resources), canonical, OG/Twitter, sitemap entry (exactly one).
- `hub.js`: Community rail from the feed's existing bounded read (`posts` by `createdAt` desc, limit 20), keeping only posts with a tag that `normalizeTag` maps to `gas-chromatography`; shows ≤5. Body text and equipment names never qualify. Today production has 0 tagged posts, so the honest empty state ("No GC discussions yet.") with Ask/Share CTAs is what renders.
- `related.js`, mounted by the **single shared loader** (`includes.js`) on `/knowledge/`, `/case-studies/` and `/blog/` paths: resolves `location.pathname` with `resourceForPath`, renders "Related knowledge" from `relatedResources` and an "Explore Gas chromatography" button when the page's technology has a published hub. Unmapped pages and index pages render nothing. Zero network reads. No per-page HTML edits (63 knowledge + 12 case + 4 blog pages already load `includes.js`).
- `feed.js`: author name links to `/profile/?uid=` via `idParam`; `?type=` prefill through `prefillType` (composer-model), which accepts only the four rule-authorized types and falls back to the default.
- `home.js`: a published hub takes precedence over a term's `entry` page, so the GC LEARN topic opens the hub; every other topic is unchanged.

## Related-content selection rule (deterministic, bounded)

Primary term = the page's first technology term, else first measurement term. Candidates = that term's content resources except the page itself (index pages never appear). Order: round-robin across the *other* hub sections in `HUB_SECTIONS` order, taking one item per section before a second of any, then the page's own section; ties keep `RESOURCES` order; duplicate titles are shown once. Limit `RELATED_LIMIT = 6`. Example: GC failure modes → GC basics, GC components, GC sampling system, GC8000 error 602, column types, 6-port valve.

## Low-volume discussion bridge — scale trigger

Client-side filtering of the latest-20 window is a bridge for the current volume (4 posts). Replace it with an indexed, server-side taxonomy relationship (tag equality query with a composite index, its own authorized slice) when any of these holds: tagged GC discussions older than the latest 20 exist and are missed; posts exceed ~200 or the per-hub-view read cost stops being negligible; more than one hub is published and each would repeat the read.

## Profile limitation

20 public profiles, 1 with `analyzersWorked` (equipment text, 2 strings), 2 with a specialization. `analyzersWorked` is equipment experience, not taxonomy; mapping it would be guessing. The hub links to the public directory generically ("Browse public professionals") and never claims GC specialists. Reliable technology→people needs a member-chosen structured field (rules change; FUTURE).

## Future hub publication rule

A term becomes a hub only when the owner authorizes it and `hubModel(slug)` returns ≥3 real content resources; publication is one taxonomy field (`hub`) plus `node scripts/build-hub.mjs`, a sitemap line and tests. Next candidates by evidence: signals-loops (15), pressure (11), laboratory-qa (13), analytical (22, umbrella).

## Deferred

`/technology/` index; other hubs; `/solve/`; search; Explore/legacy redirects; people↔technology mapping; composer tag prefill from the hub (tags remain free text); Case Study / Knowledge / General post types (Case Study becomes the natural technology-linked content type once hubs exist); NAVIGATION contract entries for hubs stay `w1` until the index exists.
