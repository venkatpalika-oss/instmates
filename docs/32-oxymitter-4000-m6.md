# Oxymitter 4000 — M6 production-readiness hardening checkpoint

M6 hardening is implemented and locally validated for owner/CTO review. No analyzer model, source gap, public route or catalog entry was added. The startup, calibration, diagnostic and assessment engines are byte-for-byte unchanged.

## Baseline and integrity

- Branch: `feature/simulations-catalog-v2`.
- Starting/final HEAD: `929f4ce14648c1564a7b007de7bff8df3021901e`.
- Preflight: exactly 31 expected M1–M5 untracked files; expected inherited extensions present; no tracked changes, unexpected files or staged content.
- Preflight: **240/240 tests passed**; hub in sync.
- The supplied manual, 00809-0100-4340 Rev AE November 2024, remains the sole device authority. Approved M0–M5 records govern the audit.
- No reset, clean, checkout realignment or removal of prior work occurred.

All M1 files, M3 calibration data/engine, M4 diagnostic data/engine, M5 training data/engine, original M2 controller/view-model, M3/M4 UI modules, prior tests/browser suites and reports 27–31 are unchanged. Preflight hashes show exactly four inherited working-file changes. The existing M5 integrity test still passes without modification.

## Files created/modified

New files:

| File | Purpose |
| --- | --- |
| `simulator-foundations/oxymitter-4000/dev/hardening-page.mjs` | UI guards, selection validation, visible safety, focus and mobile DOM order |
| `scripts/audit-oxymitter-source.mjs` | Read-only source inventory, UI prose coverage index and static footprint |
| `site-tests/oxymitter-4000-m6.test.mjs` | Four targeted audit/boundary tests |
| `site-tests/oxymitter-4000-m6-browser.mjs` | Complete keyboard journey, malformed actions, responsive/text/contrast/network checks |
| `docs/32-oxymitter-4000-source-audit.json` | All 613 datum records, evidence, blocked reasons, reviewed UI coverage and file hashes |
| `docs/32-oxymitter-4000-browser-evidence.json` | Browser version, initial requests, 40 layout checks, accessibility checks and console/network evidence |
| `docs/32-oxymitter-4000-m6.md` | This checkpoint and M7 plan |

Modified inherited files:

| File | Change |
| --- | --- |
| `scripts/serve-oxymitter-dev.mjs` | Allowlist one new local UI module |
| `simulator-foundations/oxymitter-4000/dev/index.html` | M6 label, training skip target, focusable target, footer landmark, hardening module |
| `simulator-foundations/oxymitter-4000/dev/style.css` | Long-text reflow, enlarged-text control stacking, accessible mobile table headers |
| `simulator-foundations/oxymitter-4000/dev/training-page.mjs` | Source-fact reuse, long-choice preview, input checks, table header scope, guard explanations and read-only snapshot export |

## Source audit

The source inventory walks every datum in M1, M3, M4 and M5, including lesson explanations, all answer/distractor values and practical source records. Every supported datum is checked with the existing provenance validator and supported-only reader. Every blocked datum must lack a value. The inventory retains the field path, status, value or blocked reason, evidence ID, manual section, PDF pages and figure/table.

Twelve manually reviewed UI/engine coverage groups cover technical statements outside datum values: SVG/component descriptions, startup/device displays, calibration prompts/action labels, test points, LED/LOI fault presentation, observations/actions, safety, lesson/question prompts and practical instructions. Their file hashes and evidence associations are recorded in the JSON. Data-file technical prose is inventoried directly through its datums. Styles and DOM/provenance plumbing introduce no technical statements.

This is a review against the supplied manual and approved source artifacts, not an automated claim that a source ID proves arbitrary prose. Repeated UI calibration caution/cleanup text now reads the existing M3 facts. Other retained UI literals are either source-indexed labels/procedure summaries or explicit educational infrastructure/boundary statements. Exact device messages were not stylistically rewritten.

## Source-conflict audit

All 20 M0 gap-register rows were reviewed, alongside M3-G01 and T20. No technical gap was closed.

| Gap/context | Verified boundary |
| --- | --- |
| G01 | Nernst reference text only; exact Table 8-1 lookup; no continuous solver/interpolation/extrapolation |
| G02 | Normal analog mapping remains unavailable; no assessment computes it |
| G03 | Conflicting reference-air contexts remain reference/blocked material; no pneumatic model |
| G04 | Architecture/rating contexts do not become a shared trip or thermal model |
| G05 | Historical calibration-recommended behavior and keypad initial arming remain blocked; explicit Gas 1 readiness entry only |
| G06 | Fault 9 current remains BLOCKED, including scenario presentation |
| G07 | No new complete LOI tree or firmware-version precedence |
| G08 | No calibration mathematics or combined acceptance predicate; outcomes remain pre-authored |
| G09 | Logical time only; no thermal, thermocouple-law or dynamic response model |
| G10 | Hardware INC/DEC keys remain disabled; no invented increment, repeat or rounding |
| G11 | TP5/6 remains the two exact inherited examples; no generalized conversion |
| G12 | One fault fixture; no calculated trigger priority/hysteresis or cell-age model |
| G13 | Line-frequency record remains informational, unavailable as a challenge |
| G14 | Grouped Flow/Read and documented timers only; no read sub-timer or sequencer handshake model |
| G15 | Chapter 9 cleanup guard retained through purge and AUTOMATIC; HART wording remains separately blocked |
| G16 | No supply/line pressure reconciliation or pressure-setting simulation |
| G17 | No undocumented reset/default/trim/menu behavior |
| G18 | Repository inspection informs the M7 plan only; public integration remains unperformed |
| G19 / T20 | Qualitative leak/diffuser observations only; T20 remains reference-only and excluded from challenges |
| G20 | Measurement setpoint stays in its approved context; no alternate illustrative temperature becomes a live setpoint |
| M3-G01 | Fault 13 page-132 examples stay separate from Table 8-1; no fitting/reconciliation |

Targeted tests exercise supported-reader refusals, missing blocked values, all READY diagnostic snapshots, Fault 9 output and T20 rejection. Existing calibration/assessment tests cover the remaining source boundaries. UI fallbacks retain the previous valid reference instead of inventing a replacement value.

## Defects discovered and dispositions

| ID | Finding | Disposition |
| --- | --- | --- |
| M6-D01 | After purge, navigation/power controls appeared enabled while AUTOMATIC restoration was pending; a stale power event could alter exploration startup | Fixed: UI disabled state plus capture guard through `active` or `needsAutomatic`, with visible explanation |
| M6-D02 | Malformed exact-reference or fault-reference selection could throw an uncaught exception | Fixed: validate against documented options, retain previous selection and announce rejection |
| M6-D03 | Diagnostic/calibration transitions could leave focus on a hidden control | Fixed: focus moves to the next check selector, observation, result or calibration status |
| M6-D04 | Calibration flow caution was inside setup, which collapses during the procedure | Fixed: source-backed caution stays visible while calibration/cleanup is active |
| M6-D05 | M5 repeated calibration technical prose independently of its fixtures | Fixed: inherited flow/abort/return-loop facts supply that text |
| M6-D06 | Long lesson/assessment answer choices could be truncated by native selects | Fixed: full selected text has an associated live preview; duplicate practical preview removed |
| M6-D07 | 200% text caused header/LED/review-text overflow and cramped button columns | Fixed: wrapping and responsive stacking; no content is concealed to obtain the result |
| M6-D08 | Disabled training controls lacked a specific explanation | Fixed: visible guard note and `aria-describedby` association |
| M6-D09 | Invalid scenario loading before the first scenario put the error inside a hidden panel | Fixed: visible alert outside the scenario panel; next click clears stale global feedback |
| M6-D10 | Mobile results hid table headers and lacked explicit column scope | Fixed: scoped headers remain accessibility-visible while visually clipped; labeled mobile rows retained |
| M6-D11 | Hidden exploration controls could receive stale events during assessment | Fixed: capture guard prevents exploration navigation/power events while assessment is active |
| M6-D12 | Mobile visual order put actions before the diagram, but DOM/keyboard order did not | Fixed: mobile DOM order now follows the existing visual order; desktop order restored at its breakpoint |

No unresolved newly discovered device-behavior defect is being hidden. Existing source limitations remain explicit. The remote catalog/base difference described below is an **M7 integration dependency**, not an authorization to change the M6 baseline.

## Terminology and claim audit

Educational explanations consistently distinguish source references, selected training scenarios, training actions and logical simulation time. Exact inherited LOI strings, alarm names and LED names retain their source spelling/capitalization, including the preserved Fault 3 context difference. Placeholder O₂ readings remain explicitly unmodeled.

The complete simulator text was searched for official/endorsement/certification/qualification/authorization, digital-twin, prediction and validation claims. Matches were negative boundary statements or source context; no affirmative endorsement, qualification or physical-prediction claim required removal. The product remains an educational simulator based on the supplied manual.

## Safety audit

Reviewed hazardous housing access, electrical checks/isolation, hot equipment, removed-probe service, calibration gas/flow and control-loop status. M4's persistent general and check-specific warnings remain unchanged. Electrical resistance checks require their inherited prerequisite acknowledgment; service action identification requires the inherited service warning/acknowledgment.

M6 additionally keeps calibration flow caution visible outside collapsed setup and explains why cleanup blocks navigation. Assessment uses the existing source warnings; technical caution/abort/loop wording is now read from M3 records. No new safety limit or operating threshold was introduced.

## State integrity, error robustness and DOM security

Verified the full home/lesson/startup/calibration/diagnostics/troubleshooting/assessment sequence, including the after-purge/before-AUTOMATIC boundary. Assessment still uses isolated engine instances. Retry/reset cannot bypass calibration cleanup and do not imply a hardware reset.

Adversarial UI checks included malformed reference values, missing/invalid scenario selection, missing answers/checks, repeated power/timer events, stale power events during cleanup and assessment, and an HTML-like gas-input string. Errors remain educational messages; device values/alarms are not fabricated. Existing unit tests retain double-submission, wrong ID, unsupported lookup, aborted cleanup and post-completion action checks. Same-document back/forward navigation preserves the active assessment; explicit session reset intentionally clears it.

Learner strings reach `textContent`, native input/option properties or validated selection logic. Existing `innerHTML` uses are fixed templates with no learner interpolation. The new hardening module has no HTML injection API. No global mutable source records or new model state were introduced. The two read-only UI snapshot boundaries expose snapshots, not mutable engines.

## Accessibility, responsive and large-text findings

Checked one H1/main landmark, heading progression, navigation/footer landmarks, native label associations, button names, source disclosures, visible focus, status/error announcements, touch controls, non-color LED equivalents, guard explanations and focus restoration. Independent settings retain individual labels; no radio/checkbox grouping was added that would require a new legend.

The complete M6 journey uses **Tab, Enter, Home and ArrowDown**: all six lessons, exact reference selection, exploration startup, full calibration, F2 and T19 checks, 15 questions, all four practicals, result review, retry and reset. No mouse/pointer was used for that journey. Malformed-action tests follow separately.

Representative home, calibration, diagnostics, assessment and expanded result/review screens were tested at **1440, 1024, 768, 430, 390, 360 and 320 px**. Each also passed at 320 px with **200% of every element's computed font size**. This is actual text enlargement, not a claim of browser zoom testing. Forty recorded layout conditions had zero horizontal overflow. Active safety remains outside collapsed references. Controls reflow rather than being clipped; desktop/mobile cutaway alternatives and source disclosures remain available.

All inspected native buttons/selects/inputs/summaries met the 44 px height check. No fixed/sticky obstruction was found. Reduced-motion mode passed. A computed-color contrast check covered visible enabled text, alpha-composited ancestor backgrounds and normal/large-text thresholds; minimum observed ratio was **4.69:1**, with no failures. SVG artwork and disabled controls were excluded from that text calculation; their text alternatives/native component controls remain available.

No axe package was installed. These are explicit DOM, keyboard, computed-color and visual checks using Chromium, not WCAG certification, screen-reader validation, Safari/Firefox validation or a real-device claim.

## Performance/static footprint

Native static HTML/CSS/ES modules remain; no framework, bundler or dependency was added. Current uncompressed source bytes:

| Runtime file | Bytes |
| --- | ---: |
| calibration-data.mjs | 7933 |
| calibration-engine.mjs | 7716 |
| dev/calibration-page.mjs | 14823 |
| dev/diagnostic-page.mjs | 14984 |
| dev/hardening-page.mjs | 5693 |
| dev/index.html | 10499 |
| dev/page.mjs | 7309 |
| dev/style.css | 12510 |
| dev/training-page.mjs | 13797 |
| dev/view-model.mjs | 2680 |
| diagnostic-data.mjs | 19077 |
| diagnostic-engine.mjs | 5044 |
| provenance.mjs | 2341 |
| source-data.mjs | 67649 |
| startup-engine.mjs | 5366 |
| training-data.mjs | 9673 |
| training-engine.mjs | 11172 |
| **Total** | **218266** |

Initial local load: **17 requests** — one HTML document, one CSS file and 15 native modules. Browsers deduplicate the shared imports; there are no runtime dependencies beyond browser APIs. The largest file is the intentionally explicit M1 source/provenance fixture (67,649 bytes). No technical data was compressed or rewritten merely to reduce the footprint. Obvious duplicated UI caution/preview text was removed; broader decomposition is deferred to avoid a rewrite.

This measures static source payload, not transferred compression, Core Web Vitals or field performance. Audit/test/documentation files are excluded from simulator runtime bytes.

## Network, dependency and console findings

Across local acceptance, all requests stayed on the loopback server. No CDN, remote font, API, AI request, analytics, tracker, Firebase initialization, cookie or browser-storage write was observed. No failed/missing module or asset request, console error, page exception or console warning was recorded. Browser: **Chromium 153.0.8010.0**, headless, local `/tmp/chromium`.

## Assessment and practical audit

All 15 question IDs, correct mappings, source data and difficulty labels remain unchanged. The source audit passes: 74 supported answer/explanation/choice occurrences; zero derived/unsupported answer values. The maximum remains **19 educational points**, with no pass threshold or certification claim.

All four practicals still consume existing startup/calibration/diagnostic engines. Calibration completion requires cleanup and AUTOMATIC; abort cleanup does not count as completed calibration. Diagnostic identification uses the inherited Fault 2 indication. Troubleshooting uses READY T19, not a generated leak/plugging response. The wrapper cannot assign numeric O₂, normal current, slope, constant or a physical-recovery result.

## Regression results

- **244/244 site tests passed:** all 240 inherited tests plus four targeted M6 tests.
- M2, M3, M4 and M5 browser acceptance passed with their test files unchanged.
- M6 browser acceptance passed: full keyboard/cross-workspace journey, source/guard/error cases, seven widths, 200% text, labels/controls/contrast, console/network/storage and history checks.
- Hub check: in sync. Relevant module syntax checks and `git diff --check` passed. Untracked text was separately checked for trailing whitespace.

Reproduction:

```sh
npm --prefix site-tests test
node scripts/build-hub.mjs --check
node scripts/audit-oxymitter-source.mjs
CHROMIUM_PATH=/path/to/chromium NODE_PATH=/path/to/node_modules node site-tests/oxymitter-4000-m6-browser.mjs
```

The browser suite produces `/tmp/m6-browser-evidence.json` and `/tmp/oxymitter-m6-screenshots`. The committed-style evidence files in `docs/` are local untracked review artifacts, not published assets.

## Traceability counts

| Layer | SUPPORTED datum references admitted by the source reader | DERIVED | BLOCKED records |
| --- | ---: | ---: | ---: |
| M1 | 222 | 0 | 27 |
| M3 | 40 | 0 | 9 |
| M4 | 156 | 0 | 39 |
| M5 | 120 | 0 | 0 |
| **Total occurrences** | **538** | **0** | **75** |

SUPPORTED is the simulator's existing authority label; no competing AUTHORITATIVE category was added. Counts are occurrences, including reused lesson/question/practical references, not 538 unique engineering constants or claims that all reference facts execute device transitions.

**Executable DERIVED technical values: 0. Executable UNSUPPORTED technical values: 0.** Blocked metadata has no executable value. Educational indices, scoring, logical timers and UI guards are not new physical models.

## Current public-architecture inspection

Local public files were re-read at the required M6 HEAD: Catalog V2 uses `CATEGORIES`, `TOPICS`, validated `SIMULATIONS`, `availableLabs()`, status gating, unique lab numbers/routes, category/topic IDs, equipment types and objectives. Existing routes are `/simulations/4-20ma-loop/` and `/simulations/pressure-transmitter-calibration/`.

Read-only GitHub inspection on 2026-10-01 also checked current remote `main`. It still contains the older catalog schema (`category`, `description`, `tags`, no V2 status/taxonomy contract). The public library HTML differs too. Shared includes and sitemap match the local blobs. This is a known feature-branch/base difference, not unexpected local preflight drift. No assertion is made that a GitHub file proves the live deployed version.

| File | Remote `main` blob | Local M6 blob |
| --- | --- | --- |
| `public/assets/js/simulations/catalog.js` | `d05738ff98ae3c7f4b55ac1d96fc6a3db9e619ae` | `087f25ffb111e4e836aa7079dea961e8261875d6` |
| `public/simulations/index.html` | `d7aed48a995f2aafd7d07bdb7b35fda14a8ade41` | `af201ad3776eca51831908c54d7ce9b31c0d53a9` |
| `public/assets/js/includes.js` | `2d758e676d924e44adb8570f95b8103d060cc25e` | same |
| `public/sitemap.xml` | `4408f8abae566f480acaece12978ac05c4f9491e` | same |

Shared chrome uses `/includes/header.html`, `/includes/footer.html` and `/assets/js/includes.js`. `data-public-learning="true"` suppresses Firebase/auth initialization. The shared include loader adds mobile navigation; existing simulator CSS makes it non-fixed when the page contains `#controls`. This interaction needs explicit M7 regression testing.

Firebase serves `public/`, with clean URLs/trailing slashes. Existing SEO conventions use `https://www.instmates.com/` canonical URLs, descriptions, library Open Graph metadata, the root favicon, sitemap and accessible noscript links. No hosting rewrite or backend is needed for a static Oxymitter route.

## Concrete M7 integration plan — documentation only

**Prerequisite:** owner/CTO must identify the authoritative M7 integration baseline and settle the Catalog V2/main dependency. Recheck these blobs/refs before editing. Do not silently map a V2 entry into the older main schema or merge Catalog V2 without its authorization.

Recommended plan against the approved Catalog V2 architecture:

| Path/change | Exact intended work in M7 |
| --- | --- |
| `public/simulations/oxymitter-4000/index.html` | Move/adapt the local shell into this route; preserve control IDs, source boundaries and lesson/workspace semantics |
| `public/assets/js/simulations/oxymitter-4000/` | Move the nine data/provenance/engine root modules here, preserving their relative relationships |
| `public/assets/js/simulations/oxymitter-4000/ui/` | Move the six current `dev/*.mjs` UI modules here; update the training-data view-model import from `dev/` to `ui/` |
| `public/assets/css/oxymitter-4000.css` | Move the local stylesheet and scope broad body/header/button/table rules to the simulator content, preventing shared chrome collisions |
| New route shell | Add `sim-page oxymitter-page`, `data-public-learning="true"`, shared header/footer mounts, includes script, breadcrumbs and skip/focus targets; remove the local-only brand/development header |
| Route SEO | Add title, description, canonical, matching Open Graph fields, favicon and a useful noscript notice; handle removal of development `noindex` only under the approved release/indexing gate |
| `public/assets/js/simulations/catalog.js` | Add one validated V2 entry with `id: oxymitter-4000`, proposed lab `03` only if still free, route, taxonomy, equipment and objectives; available status only when route acceptance passes |
| `public/simulations/index.html` | Add the route to the existing noscript links; avoid a second hand-maintained interactive card |
| `public/sitemap.xml` | Add the canonical route only under the authorized publication/indexing gate |
| `scripts/serve-oxymitter-dev.mjs` | Update local serving to the canonical public runtime paths; retain strict allowlisting and loopback binding |
| Source-audit script and simulator tests | Update import/path references for relocation. Preserve numerical/source/behavior assertions and pure source-file hashes |
| Public-boundary tests | Replace only the M1–M6 “route/catalog absent” checks with authorized route/catalog/indexing checks; keep blocked-model and no-backend checks |
| Existing catalog/simulation/browser suites | Verify unique route/ID/lab, new entry metadata, shared chrome, anonymous behavior, both existing routes, keyboard/mobile/large-text and zero unexpected network dependencies |

Use **one canonical runtime copy** after relocation. Do not leave parallel executable copies in `simulator-foundations` and `public`. Reports/audit evidence stay outside `public`. Core source/datums and engines should retain bytes wherever imports do not change. Existing tests that pin paths/hashes must be migrated explicitly rather than bypassed.

Do not add global navigation/homepage CTAs, additional models, storage, accounts, analytics, new dependencies, Firebase changes or deployment work merely as part of that route move. M7 scope and publication require their own authorization.

## Proposed catalog copy — not published

- **Title:** Rosemount Oxymitter 4000 Educational Simulator
- **Short description:** Explore analyzer components and documented startup, calibration, diagnostic and troubleshooting procedures, with source references and local learning assessments.
- **Category IDs:** `analyzers`, `field-skills`.
- **Topic IDs:** `oxygen`, `gas-analysis`, `calibration`, `fault-finding`, `troubleshooting`.
- **Equipment types:** `oxygen-analyzer`, `in-situ-probe`.
- **Learning objectives:** Identify probe/signal components; read exact reference points; practise documented startup and calibration sequences; interpret fault indications; follow source-backed troubleshooting checks; review educational assessment results.
- **Educational disclaimer:** Based on Rosemount reference manual 00809-0100-4340 Rev AE, November 2024. Independent educational software; not official Emerson software or certified training. Results apply only to this simulator and do not authorize live-equipment operation or service. Continuous physical response and other unsupported behavior are not simulated.

## Final Git/publication status

Branch and HEAD unchanged. **38 expected untracked files:** 31 inherited plus seven M6 files. Exactly four inherited working files modified as listed above. No tracked modification and nothing staged.

No runtime asset moved into `public/`; no public route, catalog entry, public navigation or homepage CTA was created. No stage, commit, push, PR, merge, deployment, Firebase/hosting change, workflow/settings change or production-data change occurred.

Ready for owner/CTO review. Work stops at M6.
