# Oxymitter 4000 — M7 public integration release candidate

M7 integration is implemented and locally validated for independent owner/CTO review. This is a local release-candidate source tree, not a deployment or milestone acceptance. No device behavior or engineering model was added.

## Baseline and architecture

- Repository: `venkatpalika-oss/instmates`.
- Branch: `feature/simulations-catalog-v2`.
- Starting and final HEAD: `929f4ce14648c1564a7b007de7bff8df3021901e`.
- Preflight: all 38 expected M1–M6 untracked files present; nothing staged; no tracked modifications or unexpected files.
- The four inherited M6 extensions were verified against the M6 preflight hashes: development server, local HTML, local stylesheet and training UI. All other earlier files matched that baseline.
- Preflight tests: **244/244 passed**. Hub generation check: in sync.
- Catalog V2, library HTML, shared includes loader and sitemap were reread before modification. Their Git blob hashes matched M6 inspection exactly:

| File | Preflight blob |
| --- | --- |
| `public/assets/js/simulations/catalog.js` | `087f25ffb111e4e836aa7079dea961e8261875d6` |
| `public/simulations/index.html` | `af201ad3776eca51831908c54d7ce9b31c0d53a9` |
| `public/assets/js/includes.js` | `2d758e676d924e44adb8570f95b8103d060cc25e` |
| `public/sitemap.xml` | `4408f8abae566f480acaece12978ac05c4f9491e` |

The older remote-main catalog architecture documented in M6 and the M7 authorization remains a separate release-governance dependency. M7 uses the explicitly approved local Catalog V2 architecture. No fetch, reset, rebase, merge, remote ref update or schema reconciliation was performed. This report does not claim a fresh remote-main observation.

## Canonical runtime and relocation

There is exactly one executable Oxymitter runtime in the repository:

- Route: `public/simulations/oxymitter-4000/index.html`.
- Nine source/provenance/engine modules: `public/assets/js/simulations/oxymitter-4000/`.
- Six UI modules: `public/assets/js/simulations/oxymitter-4000/ui/`.
- Stylesheet: `public/assets/css/oxymitter-4000.css`.

The former `simulator-foundations/oxymitter-4000/` directory and all 17 runtime files at those paths are absent. No executable development copy or fixture duplicate remains. Historical reports/evidence remain outside `public/` and are byte-identical.

| Former path relative to foundation | New path relative to `public/` |
| --- | --- |
| `source-data.mjs`, `provenance.mjs`, `startup-engine.mjs` | `assets/js/simulations/oxymitter-4000/` with original filenames |
| `calibration-data.mjs`, `calibration-engine.mjs` | Same module directory |
| `diagnostic-data.mjs`, `diagnostic-engine.mjs` | Same module directory |
| `training-data.mjs`, `training-engine.mjs` | Same module directory |
| `dev/page.mjs`, `dev/view-model.mjs` | `assets/js/simulations/oxymitter-4000/ui/` with original filenames |
| `dev/calibration-page.mjs`, `dev/diagnostic-page.mjs` | Same UI directory |
| `dev/training-page.mjs`, `dev/hardening-page.mjs` | Same UI directory |
| `dev/index.html` | `simulations/oxymitter-4000/index.html` |
| `dev/style.css` | `assets/css/oxymitter-4000.css` |

There is no deviation from the authorized runtime layout.

## Files created and modified

New M7 files, in addition to the relocated runtime:

- `docs/33-oxymitter-4000-m7.md` — checkpoint.
- `docs/33-oxymitter-4000-integrity.json` — all 17 path mappings and before/after hashes; historical artifact hashes.
- `docs/33-oxymitter-4000-source-audit.json` — current source audit and footprint.
- `docs/33-oxymitter-4000-browser-evidence.json` — complete journey and shared-shell evidence.
- `site-tests/oxymitter-4000-m7.test.mjs` — three integration/integrity tests.
- `site-tests/oxymitter-4000-m7-browser.mjs` — shared chrome, navigation, axe and transport checks.

Seven previously tracked files changed:

- `public/assets/js/simulations/catalog.js`: one entry appended.
- `public/simulations/index.html`: one noscript route link.
- `site-tests/catalog.test.mjs`, `site-tests/simulations.test.mjs`: expected catalog identity/count becomes three.
- `site-tests/catalog-browser.mjs`: three-card expectations and third route navigation.
- `site-tests/pressure-calibration-browser.mjs`, `site-tests/simulations-browser.mjs`: catalog count/copy expectations become three; technical assertions unchanged.

Twelve inherited untracked files changed in place:

- `scripts/audit-oxymitter-source.mjs`: canonical paths; scans only the 17 runtime files, not the whole site.
- `scripts/serve-oxymitter-dev.mjs`: direct public-file serving with an explicit asset allowlist.
- M1 unit suite and M2/M3/M4/M5/M6 unit suites: import/path migration and explicitly authorized publication-boundary expectations.
- M2/M4/M5 browser suites: imports only.
- M6 browser suite: imports, waits for shared chrome, separate M7 output paths and more informative contrast diagnostics. Existing acceptance assertions remain intact.

The M3 browser suite was already path-independent and remains byte-identical. M1–M6 documentation and historical JSON evidence are unchanged.

## Technical byte/hash integrity

**14 of 15 JavaScript modules are byte-identical to M6.** The only changed module is `training-data.mjs`: its import changes from `./dev/view-model.mjs` to `./ui/view-model.mjs`. Reversing that one literal replacement reproduces the original SHA-256 exactly. There are no other record, algorithm, scoring or behavior differences.

The new integration test verifies these hashes, the historical artifact hashes and deep equality of every current source-audit record against M6. The M5 hash gate keeps its original engine/fixture/report hashes. Its migrated test-file hashes were updated only after reviewing the path/publication-boundary diffs; it is no longer presented as proof that relocated tests are byte-identical.

The HTML changes are shell/metadata/disclaimer integration, removing the local header/footer and milestone label, changing one read-only label from “M2” to “this startup view”, and correcting the interactive SVG's accessibility role. CSS changes scope the existing rules and handle shared chrome. No technical fixture was changed to solve presentation issues.

## Public route, catalog and indexing

Local route: `/simulations/oxymitter-4000/`.

The route retains training home, all six lessons, measurement reference, startup, calibration, diagnostics, troubleshooting, 15 questions, four practicals, results, source review and reset. It is not a reduced demo. Session-only progress and all prior cleanup/navigation guards remain intact.

The shared header/footer mounts and existing includes loader are used. The body has `sim-page oxymitter-page`, `data-public-learning="true"` and `data-page="simulations"`. The main landmark is focusable; the skip link focuses training. A breadcrumb returns to the simulations library. No duplicate site navigation was added.

| Catalog field | Value |
| --- | --- |
| ID | `oxymitter-4000` |
| Lab | `03` — verified free before insertion; unique afterward |
| Title | Rosemount Oxymitter 4000 Educational Simulator |
| Status | `available` in the local release-candidate catalog |
| Route | `/simulations/oxymitter-4000/` |
| Categories | `analyzers`, `field-skills` |
| Topics | `oxygen`, `gas-analysis`, `calibration`, `fault-finding`, `troubleshooting` |
| Equipment | `oxygen-analyzer`, `in-situ-probe` |

The seven authorized objectives and exact requested catalog description were used. The normal Catalog V2 renderer creates the card. Only the existing noscript route list was manually extended. No homepage or global navigation CTA was added.

Catalog V2 has no search or category-filter controls at this scale; M7 preserves that contract rather than introducing them. Available-status filtering, invalid/duplicate taxonomy rejection, unpublished-entry exclusion and synthetic 2/5/10/25-entry rendering were tested. All three real routes remain navigable.

The title, meta description, canonical, Open Graph title/description/URL/type and favicon follow the public shell. Canonical: `https://www.instmates.com/simulations/oxymitter-4000/`.

**Indexing gate: `noindex,nofollow` retained. Sitemap entry: absent.** The existing sitemap is byte-identical. This is consistent with withholding release/indexing until explicit approval. The route has not been deployed or submitted for indexing.

## Source audit and preserved gaps

Technical authority remains exclusively manual 00809-0100-4340 Rev AE, November 2024, with approved M0–M6 artifacts. No new source or conventional engineering assumption was introduced.

| Layer | Supported occurrences | Blocked records |
| --- | ---: | ---: |
| M1 | 222 | 27 |
| M3 | 40 | 9 |
| M4 | 156 | 39 |
| M5 | 120 | 0 |
| Total | **538** | **75** |

- **Executable DERIVED technical values: 0.**
- **Executable UNSUPPORTED technical values: 0.**
- 613 datum records; blocked records remain valueless.
- All 12 reviewed UI/engine prose coverage groups retain source associations at their relocated paths.
- Question-bank audit remains 15 questions / 74 supported occurrences; educational maximum remains 19 points.

These are datum occurrence counts, not counts of unique scientific facts. Status `SUPPORTED` retains its existing meaning; relocation does not promote empirical or unsupported material into authority.

G01–G20, M3-G01 and T20 retain exactly their M6 dispositions. The proof combines unchanged engine/fixture hashes, complete source-record equality and inherited technical tests. In particular: no continuous O2/EMF solver, normal analog mapping, thermal response, generalized test-point conversion, calibration mathematics, keypad-arming resolution, undocumented increments, read/handshake timing, early automatic return, Fault 9 current reconciliation, Fault 13 reconciliation, combined-fault priority or dynamic T20 flow/mixing behavior was added. T20 remains unavailable as an executable scenario.

## Shared chrome, accessibility and responsive results

Simulator selectors are scoped to `.oxymitter-runtime`. Deliberate shared-shell adjustments are scoped to `.oxymitter-page`; no shared stylesheet or include was edited.

| Finding | Disposition |
| --- | --- |
| Shared skip link used fixed positioning | Route-scoped absolute positioning; keyboard focus target verified |
| Shared footer copyright text failed computed contrast; gradient produced further axe failures | Route-scoped solid dark footer and white copyright text; both contrast checks now pass |
| Shared mobile Menu summary was below 44 px | Route-scoped 44 px minimum |
| Open mobile dropdown covered introductory content | Route-scoped in-flow menu; open-menu bottom is asserted above main content |
| Interactive SVG retained `role="img"` despite focusable component buttons | HTML role changed to labeled `group`; existing controls and names retained |
| Existing tests assumed exactly two catalog entries | Updated catalog-only expectations to three; technical assertions preserved |

Widths tested on the actual public shell: **1440, 1024, 768, 430, 390, 360 and 320 px**.

The migrated M6 suite passes 40 layout conditions: home, active calibration, diagnostics, assessment and expanded results at all seven widths, plus representative 320 px / 200% computed-text cases. No horizontal overflow, clipped control, fixed/sticky obstruction or inaccessible active safety warning was observed. Shared-shell tests additionally check all seven widths with the mobile menu open where applicable and a 320 px / 200% text menu case. This is text enlargement, not a claim about browser zoom on every device.

The complete keyboard-only journey covers all six lessons, reference lookup, startup, full calibration and cleanup, fault/troubleshooting checks, all 15 questions and four practicals, results/review/retry/reset. Skip link, shared Menu and return-to-library navigation were checked separately.

Landmarks, heading count, labels, accessible button names, 44 px native controls, visible focus, existing status/error announcements, disclosures, LED equivalents, guard explanations, mobile DOM order and reduced motion remain checked. Minimum computed enabled-text contrast in the M6-style audit is **4.82:1**, with no failures. This custom check excludes SVG art/disabled controls; axe complements it.

Whole-public-page axe checks pass at 1440 and 320 px, including the shared menu: **zero violations**. Screenshots were inspected at desktop/mobile; the menu overlap was corrected following visual inspection. This does not establish WCAG certification, screen-reader compatibility, Safari/Firefox behavior or real-device acceptance.

Inherited cosmetic limitation: the shared footer's copyright year is blank because its embedded script does not execute through the existing includes loader. M7 does not change that shared loader or claim the cosmetic issue is fixed. No unresolved simulator behavior defect was observed within the executed coverage.

## Network, privacy and performance

The actual route loads the shared includes; its public-learning flag suppresses the existing auth loader. Browser checks found no Firebase/auth initialization, external API, AI, analytics/tracker, remote font/CDN request or storage write. Local/session storage counts are zero; cookies are empty.

Initial load measured **23 same-origin requests**, compared with M6's 17. The six additions are existing site resources: `style.css`, `simulations.css`, `includes.js`, header/footer HTML and the brand PNG. These are separated from simulator-specific resources in the evidence. The declared favicon is local; it was not an additional request in this Chromium capture.

| Footprint | Uncompressed bytes |
| --- | ---: |
| M6 simulator files | 218,266 |
| M7 simulator files, still 17 files | **224,584** |
| Increase from shell/scoped CSS/import relocation | 6,318 (about 2.9%) |
| Six existing shared resources | 86,089 |
| Total initial response bodies | **310,673** |

Largest simulator files: source data 67,649 bytes; diagnostic data 19,077; scoped stylesheet 17,399; diagnostic UI 14,984. No provenance or educational content was removed to reduce size. No framework, bundler, package or runtime dependency was added.

Console errors: **0**. Console warnings: **0**. Failed requests: **0**. Browser: Chromium 153.0.8010.0, headless. Byte figures are uncompressed source/response bodies, not compressed production transfer sizes or performance timings.

## Validation and diff review

Final gates:

- `npm --prefix site-tests test`: **247/247 passed** — prior 244 plus three M7 tests.
- `node scripts/build-hub.mjs --check`: in sync.
- `node scripts/audit-oxymitter-source.mjs`: all records validated; evidence saved.
- Relevant `node --check`: passed.
- `git diff --check` and untracked text whitespace inspection: passed.
- M2, M3, M4, M5 and M6 browser suites: passed on the canonical public runtime.
- M7 shared-shell/axe/navigation suite: passed.
- Existing 4–20 mA browser suite: **28 checks passed**.
- Existing pressure-calibration browser suite: **18 checks passed**.
- Catalog browser suite: **18 checks passed**.

Existing-simulator suites retained their technical behavior checks and automated accessibility gates; only catalog-count expectations changed. Homepage and unrelated site contracts remain covered by the full site suite. Their implementation files are unchanged.

Diff review included the tracked diff and the inherited untracked M6-to-M7 changes; ordinary `git diff` alone would miss the latter. All runtime module changes were checked byte-for-byte, with the single declared import normalization. Shell/CSS, server allowlist, audit paths, catalog metadata, migrated tests and new evidence/tests were reviewed. No weakened technical assertion, fixture change, duplicate runtime, new persistence/network path or unrelated production file change was found.

The dev server binds only to `127.0.0.1`, serves exact allowlisted public files without HTML rewrites and refuses private/unknown/old development paths. Shared library resources are allowlisted for navigation testing; full existing-simulator suites use their established local servers.

## Final Git and release boundary

- Branch/HEAD unchanged from the approved baseline.
- Working tree: **dirty by design**, with seven tracked modifications and 44 untracked files, including the preserved M1–M6 work, relocated runtime and six new M7 files.
- Index: empty; nothing staged.
- No commit, push, PR, merge, remote ref update, deployment, settings change, Firebase/Hosting change or production-data operation.
- No new commit SHA exists for M7.

Remaining release decisions are independent CTO acceptance, reconciliation of the Catalog V2 release baseline, and explicit publication/indexing authorization. This checkpoint does not authorize those actions.

READY FOR CTO REVIEW
