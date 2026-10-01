# Oxymitter 4000 M1 — source fixtures and logical startup

M1 implements an isolated, non-public foundation. It has no DOM, public route,
catalog registration, graphical LOI/keypad, calibration engine, full diagnostic
engine or challenge system. The supplied reference manual is the sole technical
authority: **00809-0100-4340 Rev AE, November 2024**. The approved M0 package
governs scope; approval of the planning baseline did not resolve its source gaps.

## Preflight and baseline

Inspected checkout: `/workspace/scratch/988b46958524/instmates`.
Remote identity: `https://github.com/venkatpalika-oss/instmates.git`.
Starting branch: `feature/simulations-catalog-v2`.
Starting HEAD: `929f4ce14648c1564a7b007de7bff8df3021901e`.
Working tree and index were clean; no untracked files. No local or ancestor
AGENTS.md/CLAUDE.md was found in the inspected paths. No fetch, branch switch,
reset, staging or remote baseline alignment was performed. This is the available
local reviewed Catalog V2 baseline; equivalence to current remote main is not
claimed. M0's missing-checkout limitation is now resolved for local architecture
discovery, without changing the approved M0 files.

Architecture found:

- Static HTML, vanilla native ES modules, Firebase JS SDK; Node v24.19.0 locally.
- Firebase Hosting publishes `public/`, uses clean URLs and trailing slashes.
  Catalog: `/simulations/`; lab routes are directory `index.html` files.
- Registry: `public/assets/js/simulations/catalog.js`; renderer: `catalog-page.js`.
  Existing labs: `4-20ma-loop` and `pressure-transmitter-calibration`.
- Existing pure domain models, separate DOM controllers, shared `ui.js`, shared
  styles and includes. The Oxymitter engine does **not** reuse `linear.js`, the
  existing loop model or pressure equations: their teaching assumptions are not
  authorized by the Oxymitter manual.
- `site-tests/package.json` runs dependency-free `node --test`. Browser harnesses
  are optional Playwright/Chromium acceptance scripts for existing public pages.
- Mobile conventions: stacked workbench, scoped CSS, flow-based bottom navigation
  in the latest polish, focused-control scroll margins, reduced-motion styles,
  labeled native controls and textual status. No mobile markup/CSS is added in M1.
- Documentation uses numbered topic files (`24`, `25`, `26`); this file is `27`.
- Build/content check: `node scripts/build-hub.mjs --check`. Hosting is static;
  there is no root package, compilation command, configured lint or type check.
- Existing deployment workflows publish on PR/main changes. None was changed or
  invoked. Rules tests require emulators and are separate from the site suite.

## Files and publication boundary

| New file | Responsibility |
|---|---|
| `simulator-foundations/oxymitter-4000/source-data.mjs` | Immutable evidence-backed reference fixtures and explicit blocked records |
| `simulator-foundations/oxymitter-4000/provenance.mjs` | Source/status/value validation, immutable data, supported-only value access |
| `simulator-foundations/oxymitter-4000/startup-engine.mjs` | Pure logical startup engine and explicit test/educational controls |
| `site-tests/oxymitter-4000.test.mjs` | Independent source expectations, engine boundaries and publication checks |
| `docs/27-oxymitter-4000-m1.md` | Architecture, validation and M1 completion report |

No tracked existing file is modified. `.mjs` is used so these native ES modules
load without changing package configuration. The foundation folder is outside
Firebase Hosting's `public/` root and cannot become public through the existing
Hosting layout. It remains inside the actual git project, not a detached demo.
Later authorized integration may move/package modules into the established
public asset convention; no bundler or development route is required now.

## M0 review and provenance

Read the complete M0 deliverable set: evidence matrix, technical/measurement
specifications, startup/calibration transitions, fault/scenario matrices,
LOI/keypad and test-point specs, UI/integration/milestone plans, decision register,
reference points and manifest. M0 source-file hashes and package hash are embedded
in `SOURCE_DATA.m0Baseline` to identify the approved input. Original M0 documents
and manual were not edited. The manual SHA-256 is
`10797192d9fabc4dba8e966a71e69f300f2ceb64c71f98a0f74444bdc17de3ee`.

Each technical datum has `status`, `value`, `unit`, and
`source.evidenceId`. The central evidence index maps that ID to manual
section, 1-based PDF pages, figure/table and description. E01–E75 are M0 evidence
IDs; F01–F17 point to the fault matrix's explicit section/page references.
`SOURCE_DATA.manual` identifies the single manual governing all those references.
JSON-like data is deeply frozen and validated when imported.

`SUPPORTED` needs a real value, unit and valid source. `DERIVED` and `UNSUPPORTED`
have no executable value in M1; they require a `BLOCKED` marker, gap ID and reason.
`readSupported` rejects both. A fabricated “owner approval” field cannot enable a
derived rule. Schema validation is a provenance/shape guard, not proof that a
new author's claimed number is truthful; independent source tests still matter.

## Fixture sets

- Exactly 20 O₂/EMF pairs from Table 8-1, PDF pp107–108, with per-value source
  references. No interpolation, extrapolation, continuous solver or public
  measurement function. Table endpoints 100% and 0.01% remain reference points,
  not a device range or detection claim.
- Operating values: 736 °C cell setpoint, 20.95% reference oxygen, approximately
  30-minute warmup, local ranges 0–10/0–25%, documented HART range description,
  default 0–10%, housing/internal temperature limits, 0.02% detectable limit,
  3.5/21.6 mA startup selections and 3.5 mA default, track/hold facts.
- Fifteen numbered fault definitions plus incomplete line-frequency and historical
  calibration-recommended records. Fields preserve documented messages, diagnostic
  groups, blink counts, self-clearing classifications and trigger descriptions
  where available. Definitions do not execute trigger predicates or clearing.
  Fault 9 current is blocked, not silently chosen from contradictory source text.
- TP1+/TP2− cell mV; TP3+/TP4− thermocouple voltage; TP5+/TP6− process/test O₂
  roles and only the exact 8%→8 V and 0.4%→0.4 V examples. No universal transfer
  or virtual multimeter is implemented.
- Calibration data only: low 0.4–2% / high 8–21% in nitrogen, typical 0.4/8% pair,
  gas-order fact, 300 s gas flow, 3-minute purge, 30-minute application wait,
  slope 35–52 mV/dec and constant −4 to 10 mV reference bounds, diffuser/flow
  setting caution. No calculations or acceptance predicate execute.
- Conflicting reference-air, pressure and process-temperature contexts have
  source-backed explanatory records but **no selected executable value**.

## Startup architecture

M0's persistent state names are retained: `POWER OFF`, `WARM UP`,
`NORMAL OPERATION`, `FAULT INDICATION`. Applying power is an event that turns
the heater on and enters warmup; no artificial `POWER APPLIED` dwell state is
created. Transitions cite M0/manual evidence (pp68/79/85/86).

`createStartupEngine` returns only:

- `snapshot()` — immutable current device and infrastructure observations.
- `applyPower()` — requires power off; enters warmup, documented heater ON and
  `Warm up` LOI indication, with selected startup output (3.5 or 21.6 mA).
- `advanceLogicalTime(seconds)` — explicit deterministic educational/test clock,
  only in warmup; approximately 30 minutes is represented as a 1,800-second
  software completion milestone. It does not claim actual cell temperature.
- `advanceIndication()` — advances a documented LED **order** independent of
  elapsed time. No blink/sequence cadence is guessed.
- `reportStartupFault(id)` — startup-only externally reported error boundary.
  It displays a known message but does not calculate trigger, LED blinking,
  fault current, self-clear or multiple-fault priority. Historical recommended
  alarms cannot be injected. No full fault simulator or normal-operation fault
  injection is exposed.
- `removePower()` — resets local infrastructure for another exercise. Removing
  an externally reported marker is not a claim of physical repair or automatic
  clearing of a non-self-clearing alarm.

Warmup diagnostic sequence: CALIBRATION, then O₂ CELL, then HEATER, then
HEATER T/C cumulatively lit; all off together; repeat (p79). Normal sequence:
HEATER T/C → HEATER → O₂ CELL → CALIBRATION, one at a time; repeat (pp79/81).
Normal LOI enters its O₂ display mode with no invented numeric reading.
Normal analog output remains blocked (G02). No graphical artwork, timer-driven
animation, CAL activity or deprecated calibration-recommended logic is added.

The caller/test chooses time advancement and indication advancement. Those are
software controls, not real analyzer keys or measured device behavior. There is
no `setInterval`, heater ramp, inferred power/temperature relationship or damping.
M1 authorization specifically permits the logical clock; G09 remains open for
physical dynamics, complete thermocouple conversion and real indication cadence.

## Validation and completion report

Before edits: **128/128 existing site tests passed**, hub check in sync.
New M1 tests: **25/25 passed**. Final combined site suite: **153/153 passed**,
zero failures/skips. No existing tests were edited, removed or weakened.

Independent tests transcribe the PDF's 20-point table and Tables 2-8/8-2 fault
expectations separately from generated fixtures. They cover exact values,
range/detectability separation, provenance and immutability, invalid schemas,
unsupported/derived execution rejection, startup state/clock boundaries,
LED orders and repeat behavior, no time-derived LED cadence, unavailable numeric
O₂/normal current, startup fault limits, invalid inputs, power reset, independent
instances and unexposed solvers/calibration/games/public route.

Commands:

```sh
npm --prefix site-tests test
node --test site-tests/oxymitter-4000.test.mjs
node scripts/build-hub.mjs --check
node --check simulator-foundations/oxymitter-4000/provenance.mjs
node --check simulator-foundations/oxymitter-4000/source-data.mjs
node --check simulator-foundations/oxymitter-4000/startup-engine.mjs
node --check site-tests/oxymitter-4000.test.mjs
git diff --check
```

Hub/content build check: **in sync**. JS syntax checks: **passed**.
Lint: **not configured**. Type checking: **not configured**. Separate production
compilation: **not configured**, static Hosting. Browser harnesses not rerun:
no public files/DOM/UI were changed. Firestore/Storage emulators not run:
no backend/rules/config changes. M1 asserts model/data correctness, not browser,
mobile visual or physical-equipment fidelity. Those belong to later milestones.

Traceability: **222 SUPPORTED technical datum records**, **0 executable DERIVED
records**, **0 executable UNSUPPORTED records**. There are **27 blocked metadata
records**, which are not executable technical values. Counts come from the
recursive fixture validator; they count datum records, not 222 distinct firmware
behaviors. Startup has eight source-backed behavior entries in `SOURCE_DATA.startup`.

Final repository state: same branch and HEAD; index unchanged. Five new untracked
files (listed above), no modifications to tracked files. No commit, staging,
push, PR, merge, deployment, setting change, production data modification,
Firebase change, hosting change or public catalog integration.

## Blocked work and extension points

M0 G01/G02/G08/G11 continuous EMF, analog endpoints, calibration math and TP
generalization remain blocked. G03/G04/G06/G16 conflicting air/variant/fault9/
pressure contexts have no implicit precedence. G05 recommended-feature behavior,
G07 LOI variants, G10 gas increments, G12 priority/clearing, G13 line-frequency
details, G14 subphase/handshake timing, G15 safe return wording, G17 menu details,
G19 qualitative magnitudes and G20 temperature contexts remain future gates.
G18 local architecture discovery is satisfied; live/current remote deployment
identity and integration are not part of M1.

Future interfaces can consume immutable snapshots and evidence references. Full
fault, calibration, menu, measurement or catalog behavior must arrive under its
own authorization and resolved decision entries. M1 stops at local owner review.
