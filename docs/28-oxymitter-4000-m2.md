# Oxymitter 4000 — M2 completion report

M2 is complete for local owner review. It is not authorized for deployment.

## Baseline and retained work

- Branch: `feature/simulations-catalog-v2`
- Starting and final HEAD: `929f4ce14648c1564a7b007de7bff8df3021901e`
- Initial tree: exactly the five approved untracked M1 files; no tracked changes or unexpected untracked files. Preflight full suite: 153/153; hub in sync.
- All five M1 files retained byte-for-byte: `docs/27-oxymitter-4000-m1.md`, `simulator-foundations/oxymitter-4000/{provenance,source-data,startup-engine}.mjs`, `site-tests/oxymitter-4000.test.mjs`. SHA-256 comparisons against preflight passed.
- No existing file modified. Nothing staged or committed.

## M2 files created

| File | Purpose |
| --- | --- |
| `simulator-foundations/oxymitter-4000/dev/index.html` | Original SVG cutaway, semantic controls and inspector structure |
| `simulator-foundations/oxymitter-4000/dev/style.css` | InstMates industrial workbench, responsive layouts and focus states |
| `simulator-foundations/oxymitter-4000/dev/page.mjs` | DOM presentation over the unchanged M1 engine and fixtures |
| `simulator-foundations/oxymitter-4000/dev/view-model.mjs` | Exact lookup, evidence resolution, display formatting and component descriptions |
| `scripts/serve-oxymitter-dev.mjs` | Loopback-only, allowlisted development server |
| `site-tests/oxymitter-4000-m2.test.mjs` | Four M2 tests included in the standard suite |
| `site-tests/oxymitter-4000-m2-browser.mjs` | Separate Playwright interaction and viewport acceptance test |
| `docs/28-oxymitter-4000-m2.md` | This completion report |

## Local review

From the repository root:

```sh
node scripts/serve-oxymitter-dev.mjs
```

Open `http://127.0.0.1:4174/simulations/oxymitter-4000/` locally. An optional port may be supplied as the first argument. Stop the server with Ctrl-C.

The development files remain outside Firebase's `public/` folder. The server maps the preferred eventual route only on loopback and exposes only the required source modules/assets. It does not serve the repository generally. This retains the repository's standalone HTML/native-module approach and preserves M1's test requiring no public Oxymitter route. No hosting configuration changed.

## Visual and interaction features

Desktop uses a light industrial workbench: an original blue/steel SVG cutaway on the left, instrument/startup controls on the right, and a source reference bench below. Mobile places status and startup controls first, then the compact diagram and component descriptions. No fixed or sticky overlays.

- Eleven components support pointer selection on the diagram and equivalent native buttons. Keyboard activation and visible focus are provided. The panel shows role, available documented value or engine state, and source.
- The cutaway shows process/diffusion/cell, reference side, heater, thermocouple, probe/calibration passage, electronics, alternative local interface, the shared analog/HART loop and separate logic I/O. It is explicitly schematic, not an installation or wiring drawing.
- Membrane representation shows four diagnostic LEDs with ON/OFF text. Calibration activity and five gas/calibration keys are read-only.
- LOI has four read-only navigation keys, documented warm-up/alarm text and a normal `O₂: --.-- %` placeholder. Lockout is explicitly inactive; no fabricated lock state or menus.
- Apply/remove power, logical +1/+5-minute controls, warm-up completion and manual Next indication call M1 directly. No timers, temperature ramp or inferred LED cadence.
- Startup alarm selection is enabled only in warm-up. It reports an external condition through M1; no normal-operation fault injection or fault-clearing model.
- Exact twenty-point O₂/EMF selector and table use the original fixture objects. No arbitrary input, interpolation or connected curve. Lookup values remain separate from instrument readings.
- Reference inspector exposes cell setpoint/reference oxygen, ranges, outputs, temperatures, calibration data, all three test-point pairs and seventeen fault/historical records. Longer sections collapse progressively.
- TP5/TP6 exposes only the two approved examples. Fault inspection is read-only and distinguishes historical records and blocked predicates.
- Sources resolve through M1 evidence records, showing manual/revision, section, PDF page and figure/table when available. Numeric technical values come from fixtures; elapsed minutes are an infrastructure unit conversion.

## Source boundary and traceability

Sole technical authority remains supplied manual 00809-0100-4340 Rev AE, November 2024, under approved M0/M1. M1 fixtures, engine and tests are unchanged.

| Traceability measure | Result |
| --- | --- |
| SUPPORTED source-value records available to executable readers | 222, unchanged from M1 |
| DERIVED technical-value records | 0 |
| Executable UNSUPPORTED values | **0** |
| BLOCKED metadata records | 27, unchanged; displayed as explanations, never substituted as model values |

These counts describe the inherited source model, not a claim that every reference value executes device behavior. M2 adds presentation and exact selection only. The existing provenance reader guards supported values; strict lookup rejects non-table inputs.

Continuous O₂/EMF calculation, normal analog mapping, calibration mathematics, physical heater dynamics and generalized test-point conversion remain blocked. Calibration and full diagnostics remain later milestones. Existing reference-air, calibration-pressure and process-temperature conflicts are visible and unresolved. No new source conflict discovered; no M0 decision required for this scope.

## Validation performed

- Standard suite: **157/157 passed**, comprising 25 retained M1 tests, four M2 tests and 128 other existing tests. No tests weakened.
- `node scripts/build-hub.mjs --check`: hubs in sync.
- `node --check`: all new JavaScript modules/scripts passed.
- `git diff --check`: passed. New untracked text files separately checked for trailing whitespace.
- Playwright acceptance passed using the available `/tmp/chromium` binary. The default Playwright browser was missing; its download failed, so the existing local binary was used without changing repository dependencies.
- Browser checks: keyboard Apply power; warm-up and normal LED sequences; logical time; remove power; LOI warm-up/normal/startup alarm; normal-operation alarm disabled; all twenty lookups; no numeric entry; exact test-point examples; visible blocked explanations; no browser page errors.
- Desktop 1440 px and mobile 430/390/320 px: screenshots captured; no horizontal overflow with all reference sections collapsed or expanded. Visible native buttons/selects have minimum 44 px height. Reduced-motion media setting verified; CSS has no autonomous animation.
- Screenshots visually inspected at desktop and all three mobile widths, plus LOI normal/alarm views. This is local Chromium validation, not a claim of cross-browser, screen-reader or physical-device certification.

Reproduce browser acceptance with Playwright available to Node:

```sh
CHROMIUM_PATH=/path/to/chromium NODE_PATH=/path/to/node_modules node site-tests/oxymitter-4000-m2-browser.mjs
```

`CHROMIUM_PATH` may be omitted when Playwright's browser is installed. Screenshots default to `/tmp/oxymitter-m2-screenshots`; override using `OXYMITTER_SCREENSHOTS`. They are reproducible QA outputs, not production assets.

## Publication boundary

Not in the catalog. No homepage CTA or navigation link. No deployment, staging, commit, push, PR or merge. No Firebase, hosting, workflow, repository-setting or production-data changes. Work stops at M2 owner review.
