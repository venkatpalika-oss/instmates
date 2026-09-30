# Simulations V1 — local implementation for Astra review

## Integration

Baseline: `main` at `7110edb68746baecfe0f302254671f84c60673d8`.
The site is static HTML with native ES modules, shared includes, global CSS,
Firebase Hosting clean URLs and a dependency-free `node:test` site suite.

The existing product navigation is Solve / Learn / Connect / Contribute.
The proposed Home / Learn / Troubleshoot / Simulations / Community / About
navigation would rename and reorganize existing product areas. This slice
instead adds Simulations after Learn in both shared header menus, plus a footer
link and a Knowledge Hub cross-link. Existing bottom navigation is retained;
Simulations is reachable through the mobile Menu. No taxonomy hub generator or
existing content-map entries are changed.

Routes:
- `/simulations/` — catalog with four categories and honest unpublished states.
- `/simulations/4-20ma-loop/` — working simulator and three diagnostic scenarios.

Both routes reuse the official logo/header/footer. Page-scoped CSS uses the
Light Technical Canvas colors #0b3c5d / #1f78b4, white and pale blue. The include
loader gains an explicit `data-public-learning="true"` opt-out from loading
Firebase Auth. Only the new pages opt out, hide session controls, and make no
Auth/Firestore requests. Existing pages retain their loader behavior. No
framework or production dependency is added.

## Module boundaries

| File under public/assets/js/simulations/ | Responsibility |
|---|---|
| linear.js | Pure range validation, percent, forward/reverse conversion, clamp |
| loop-model.js | Validated state, defaults, seven fault selections, receiver quality, diagnostics and challenge data |
| ui.js | Number input reading, formatting, safe text updates, meter fill |
| loop-page.js | DOM wiring, live updates, input errors, reveal controls, challenge lifecycle |
| catalog.js | Category and published-simulation registry |
| catalog-page.js | Safe DOM rendering of registry entries |

Future simulations can reuse linear calculations, UI helpers, scoped controls,
meters, panels, quality badges and native details/radio patterns. Add working
entries to the catalog, provide a pure domain model and controller, and add
model/browser tests. Do not present an unavailable simulation as a working link.

## Controls and numerical contract

- Transmitter LRV/URV and PV in engineering units; PV slider spans LRV to URV.
- Unit labels: bar, kPa, °C, m, %. Relabeling does not convert existing values.
- Follow-process or forced test-current mode (0–24 mA).
- Independent receiver values at 4 and 20 mA; explicit match-range action.
- Fault selector; adjustable stuck current, zero offset and span error.
- Reset restores the documented defaults. Exiting a challenge restores the
  prior valid sandbox settings; starting from invalid input restores defaults.

Forward: `mA = 4 + ((PV - LRV) / (URV - LRV)) * 16`.
Reverse: `PV = LRV + ((mA - 4) / 16) * (URV - LRV)`.
Receiver conversion uses the receiver's endpoints, not the transmitter's.
Calculation helpers extrapolate. The domain model applies limits separately.

Only finite direct-acting ranges with URV > LRV are supported. General numeric
inputs are bounded to ±1,000,000; forced/stuck current to 0–24 mA; zero shift to
±4 mA; span error to ±50%. Equal/reversed ranges, blank fields and nonfinite
values clear old readings and stop calculation. No NaN or stale engineering
value is presented as live.

## Fault definitions

| Selection | Explicit behavior |
|---|---|
| Normal | Linear process output; receiver independently scaled |
| Open loop | Broken series path: measured loop/input 0 mA; transmitter command remains a calculated demand |
| Short / low current | Bypass across receiver sensing resistor: series current continues, input current is 0 mA |
| Current stuck | Selected fixed current, independent of PV; default 4 mA gives a plausible zero indication |
| Zero shift | Add selected mA offset before process saturation |
| Span error | Multiply only the 16 mA live span by 1 + error/100; 4 mA zero remains anchored |
| Wrong DCS scaling | On selection, load DCS LRV equal to transmitter LRV and half its span; editable/correctable afterwards |

The short model is deliberately topology-specific. It does not assert that all
shorts produce low series current. Zero/span faults are bypassed in forced
current mode, with a visible explanation. Selecting Normal does not silently
undo independent receiver scaling edits.

Process mode saturates at 3.8–20.5 mA as a stated teaching convention; these are
not universal hardware settings. Receiver quality is GOOD at 4–20 mA, OUT OF
RANGE at 3.8–4 or 20–20.5 mA, and BAD beyond those limits. BAD suppresses the
engineering indication while retaining clearly labeled raw arithmetic. A
valid-range stuck signal can remain GOOD while being wrong. Real receivers may
instead clamp, hold last value, or use different limits.

## Learning and challenges

The path displays process, output command, measured series current, measured
receiver input and engineering indication. The field-check panel asks learners
to compare an independent reference and actual measurement points. Diagnostic
checks remain closed until explicitly revealed.

Three deterministic challenges cover scaling mismatch, stuck output and an
open/lost-supply path. Fault controls and the diagnostic reveal are hidden;
learners submit a diagnosis before feedback. There is no login, persistence,
leaderboard, score service or production data access. Scenarios identify a
sensible first investigation rather than claiming uniquely determined causes.

## Responsive and accessibility behavior

Desktop uses a category rail, equipment workbench with controls beneath, and
a learning panel. Narrow screens stack equipment in process-to-display order; a compact fixed loop/DCS readout keeps the
response visible while editing controls. Shared bottom navigation is preserved.
A page-scoped footer wrap rule resolves the 320 px legal-row overflow without
altering unrelated pages. Challenge mode hides controls and keeps the equipment readings visible.

Native labeled number/select/range inputs, fieldsets/legends, radio choices,
buttons and details/summary support keyboard use. There is a skip link, visible
focus styling, a polite debounced reading summary and input error alert.
Reduced-motion mode disables current movement while retaining a static cue.
Duplicate mobile readouts are hidden from assistive technology.

## Validation and reproducibility

Baseline site suite: 85/85 pass.
Final site suite: 103/103 pass (18 added tests; none skipped).
The existing header test's exact expected list was extended with Simulations;
no existing assertions were removed or loosened.

Commands:

```sh
npm --prefix site-tests test
node scripts/build-hub.mjs --check
git diff --check
node site-tests/simulations-browser.mjs
```

The optional browser suite requires Playwright and a compatible local Chromium,
installed outside production dependencies. It starts its own loopback server,
blocks every external request and saves evidence to `/tmp/instmates-sim-evidence`
(or `SIM_EVIDENCE_DIR`). Set `SIM_CHROMIUM_PATH` for a custom executable and
`SIM_AXE_MODULE` to enable axe checks. `SIM_BASE_URL` accepts localhost only.

In this environment, validation used:

```sh
SIM_CHROMIUM_PATH=/tmp/sim-browser/chromium \
SIM_AXE_MODULE=/tmp/instmates-browser-tools/node_modules/@axe-core/playwright \
node site-tests/simulations-browser.mjs
```

17 browser acceptance groups passed: initial render; five live reference points;
arbitrary ranges; invalid-input recovery; all faults; forced current; keyboard
slider; keyboard details; all three challenges and sandbox restoration; six
viewport widths (320, 390, 768, 820, 1024, 1440); keyboard mobile Menu; mobile
readout; reduced motion; axe on simulator main; axe on landing main; catalog
navigation; zero external requests/HTTP errors/console errors/runtime errors.

Axe reported zero violations in the new main-content regions. This does not
certify the pre-existing shared shell or replace manual screen-reader testing.
Chromium screenshots were visually reviewed. Firefox, Safari and physical
iOS/Android devices have not been exercised. Firestore emulator tests were not
run: this slice has no rules or backend changes. Hub output remained in sync.

The default Playwright browser download failed in this environment. A separate
npm-packaged Chromium was unpacked outside the repository for browser tests;
no repository dependency or lockfile was changed.

## Limits and next candidates

This is steady-state linear instrumentation learning, not a plant design or
safety-validation tool. It omits supply/compliance calculations, wire resistance,
HART, noise, response dynamics, inverse ranges and square-root extraction. It
supports one selected fault at a time and three repeatable scenarios. The
functional diagram is not an electrical wiring schematic. Other catalog
categories are planned and contain no fake launch links.

Recommended subsequent simulations, each requiring separate authorization:
1. Loop supply, receiver burden and transmitter compliance.
2. DP flow with square-root extraction and low-flow cutoff.
3. Sample conditioning transport delay and restriction faults.
4. Oxygen analyzer response to calibration gas and sample leaks.
5. First-order process response and PID fundamentals.

Technical references informing model boundaries:
- https://www.ni.com/en/shop/data-acquisition/fundamentals--system-design--and-setup-for-the-4-to-20-ma-curren.html
- https://www.emerson.com/en/measurement-instrumentation/catalog/pressure-measurement/4051s-manual

No commit, push, PR, merge, deployment, cloud configuration change or production
data write is part of this implementation. Astra review is the next gate.

## Visual enhancement — local review

The existing model, conversion helpers and challenge definitions are unchanged.
Four original generic equipment SVGs and 13 topic icons are local assets under
`public/assets/images/simulations/`; the asset README records provenance.
HTML overlays show live transmitter command and engineering indication. A
normalized PV gauge moves independently of the vessel (no liquid-level claim).

Open paths show disconnected contacts and stop signal movement everywhere.
Receiver bypass displays its specific bypass route while retaining series flow.
Stuck current remains fixed as the process gauge and ideal output change.
Zero/span differences display command minus ideal. Scaling mismatch highlights
receiver/display while preserving healthy loop animation. Challenges suppress
named fault cues and equipment diagnosis highlights. Invalid inputs clear all
new readings. Reduced motion retains a static active wire and numeric values.

The landing page has technical topic icons, an AVAILABLE lab and non-linked
COMING SOON topics. Desktop uses three columns above 1250px, two intermediate
columns, then a single workbench; at 600px and below equipment stacks vertically.
The existing fixed mobile readout and shared mobile navigation are retained.

Visual regression validation: 103/103 site tests and 25/25 browser groups
(including all prior 17 groups), zero axe violations in both main regions,
zero external requests and console/runtime/HTTP errors. New checks cover
fault visualization, gauge/current independence, invalid-readout cleanup,
challenge concealment, mobile ordering, static motion fallback and local icons.
Eight screenshots capture landing and simulator desktop/mobile, mobile viewport,
open loop, scaling mismatch and challenge mode. Browser captures scroll to the
top to avoid sticky-position artifacts in full-page images.

Limitations: generic functional art, not a complete powered wiring schematic;
long mobile page requires scrolling; fixed mobile strips cover the bottom of
the current viewport. No Safari/Firefox, physical-device or manual screen-reader
validation. Existing shared-shell accessibility remains outside the axe scope.


## Final UX polish — local only

This section supersedes the fixed-mobile-strip behavior described in the earlier
implementation and visual-review sections. Approved engineering and artwork are
preserved; linear.js, loop-model.js (including challenges), and ui.js retain their
pre-polish SHA-256 hashes.

- At phone widths, equipment columns shrink from 120px to 80px, with tighter
  spacing and the same Process → Transmitter → Loop → PLC/DCS → Display order.
- Mobile jump links reach controls and challenges directly.
- The readout now lives within the controls and contains PV, ideal output,
  actual loop current and DCS indication. It sticks only while using the form;
  it disappears with the form during challenges. Invalid inputs clear all four.
- The simulator's mobile bottom navigation keeps its links and order but uses
  normal document flow, removing the overlapping fixed strips. Other pages and
  desktop navigation are unchanged. Focus/anchor scroll margins reserve room
  for the readout. At viewport heights <=500px the readout becomes static.
- Desktop architecture, calculations, fault semantics, challenge lifecycle,
  dependencies and cloud configuration are unchanged.

Validation: 103/103 site tests; 28/28 browser acceptance groups, retaining all
prior checks; hub generation in sync; git diff --check clean. Browser checks cover
320/360/390/430/768/820/1024/1440px overflow, actual focused-control geometry,
anchor visibility, live readout updates and invalid/fault states, short viewports,
mobile challenge focus, reduced motion and keyboard navigation. Axe reports zero
violations in both main-content regions. Zero external requests, HTTP errors,
console errors or runtime errors. Browser tools were installed only under /tmp.

Visually inspected desktop simulator, open/scaling faults, desktop/mobile catalog,
mobile simulator, 320/430px controls and mobile challenge screenshots. At 390px,
the full simulator capture decreases from 4934px to 4695px; the page still scrolls,
but jump links bypass the diagram and readouts follow the active controls.
Evidence: /workspace/scratch/7636e08e223e/final-evidence/ (browser-results.json,
accessibility.json and PNG screenshots). Safari/Firefox, physical devices and
manual screen readers remain untested; a short viewport test is not a physical
on-screen-keyboard test. Automated axe coverage remains scoped to main content.

HEAD remains 7110edb68746baecfe0f302254671f84c60673d8; index remains empty.
This polish changes only simulations.css, loop-page.js, the loop page HTML,
simulations-browser.mjs and this document. No staging, commit, push, PR, merge,
deployment, GitHub/Firebase/GCP change or production data write occurred.
