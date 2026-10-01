# Oxymitter 4000 — M4 diagnostics and troubleshooting checkpoint

M4 is implemented and locally validated for owner review. The trainer activates one deterministic source scenario, supports documented checks and corrective-action identification, and stops without simulating a physical repair or alarm recovery. Twenty bounded scenarios are interactive; the remaining M0 scenario is reference-only.

## Baseline

- Branch: `feature/simulations-catalog-v2`
- Starting/final HEAD: `929f4ce14648c1564a7b007de7bff8df3021901e`
- Initial tree: exactly nineteen expected M1/M2/M3 untracked files; no tracked changes, unexpected files or staged content.
- Preflight full suite: 180/180 passed. Hub check: in sync.
- Sole technical authority: supplied Rosemount 00809-0100-4340 Rev AE, November 2024, plus the approved M0–M3 artifacts. All 21 M0 troubleshooting rows were reviewed against their manual contexts. Relevant text was inspected across Chapter 8 and service/safety sections; rendered pages 114 and 139 were also checked.
- No reset, clean, deletion, staging or baseline realignment performed.

## Files and milestone integrity

Six new files:

| File | Purpose |
| --- | --- |
| `simulator-foundations/oxymitter-4000/diagnostic-data.mjs` | Source fixtures, fault references, checks, safety contexts, scenario classification |
| `simulator-foundations/oxymitter-4000/diagnostic-engine.mjs` | Single-scenario workflow, manual blink stepping, deterministic observations |
| `simulator-foundations/oxymitter-4000/dev/diagnostic-page.mjs` | Diagnostics workspace and bounded virtual meter |
| `site-tests/oxymitter-4000-m4.test.mjs` | 34 M4 tests |
| `site-tests/oxymitter-4000-m4-browser.mjs` | Browser interaction, keyboard and viewport acceptance |
| `docs/30-oxymitter-4000-m4.md` | This checkpoint |

Four inherited working files modified:

| File | Change |
| --- | --- |
| `simulator-foundations/oxymitter-4000/dev/index.html` | Local Diagnostics workspace entry/panel/module and milestone wording |
| `simulator-foundations/oxymitter-4000/dev/style.css` | Diagnostic safety, meter, indication and responsive styles |
| `simulator-foundations/oxymitter-4000/dev/calibration-page.mjs` | Disable Diagnostics navigation during an active calibration, preserving its cleanup guard |
| `scripts/serve-oxymitter-dev.mjs` | Allowlist the three new runtime modules |

All five M1 files remain byte-for-byte unchanged. M3 calibration data and engine, M2 view-model/startup controller, all prior test files and prior reports remain byte-for-byte unchanged. Baseline checksums identify only the four intended extensions above. No prior test was weakened.

## Diagnostic engine and fault coverage

All fifteen numbered fault identities are reused directly from M1, preserving numbers, names, LOI messages, LED groups, blink counts, pauses, self-clearing classifications, trigger descriptions and output conflicts. M4 does not alter M1's `simulationImplemented` flags; its separate engine selects training fixtures rather than enabling a physical fault model.

A scenario progresses through check selection, prerequisite acknowledgment, meter/source-review operation, source observation, diagnosis selection and corrective-action identification. Invalid choices increment a procedural error count and show **TRAINING ACTION NOT APPROPRIATE FOR THIS DOCUMENTED SCENARIO**. They do not change device indications or create consequences.

Successful completion means **DOCUMENTED CORRECTIVE ACTION IDENTIFIED — EXERCISE COMPLETE**. The active fault remains displayed. Self-clearing/reset descriptions are taught as source facts; no repair, reset, cooling, clearing, multi-fault priority or recovery transition is invented.

Blink stepping presents each documented flash index, then the documented pause, then repeats only when the learner advances it. Fault 2 retains its two-second pause; other numbered fixtures retain their documented pauses. Pulse duration is unspecified and no autonomous cadence runs.

The LOI uses exact M1 messages. Fault 3's Table 8-2/M1 `O2 T/C Reversed` and section 8.5.3 `O2 T/C REVERSED` capitalization difference is noted separately rather than silently normalized.

Critical outputs use only the inherited supported SW2 choices as an educational configuration. Fault 9 remains blocked by G06. Tracking and no-alarm cases never produce numeric normal current or an O₂ value.

## All 21 M0 scenario classifications

READY means the bounded checks and action-identification exercise is fully specified, not that every possible branch, service procedure or physical behavior is implemented. Missing numeric readings remain blocked.

| M0 ID | Classification | Interactive scope / limitation | Source |
| --- | --- | --- | --- |
| F1 | READY FOR M4 | J1 seating, open-T/C voltage, isolated lead check; blank repair cross-reference remains explicit; separate §9.3.11 service reference only | §8.5.1 pp111–113; §9.3.11 pp162–163 |
| F2 | READY FOR M4 | Shorted-T/C voltage and isolated board-side resistance | §8.5.2 pp113–114 |
| F3 | READY FOR M4 | Negative-voltage/reversed-wire branch; correctly wired PC-board alternative remains reference-only | §8.5.3 pp115–116 |
| F4 | READY FOR M4 | Recognize A/D error and identify factory escalation; no numeric test supplied | §8.5.4 pp116–118 |
| F5 | READY FOR M4 | Isolated J8 open-heater check, fault-specific good-heater comparison | §8.5.5 pp118–120 |
| F6 | READY FOR M4 | Documented restart/cool interval reviewed; pre-authored recurrence branch, no cooling model | §8.5.6 pp120–122 |
| F7 | READY FOR M4 | Ambient/convection installation context and spool/relocation direction | §8.5.7 pp122–124 |
| F8 | READY FOR M4 | J8 check and its own good-heater reference; no automatic transition to Fault 5 | §8.5.8 pp125–126 |
| F9 | READY FOR M4 | Identify documented recovery condition; current and physical recovery blocked | §8.5.9 pp126–127 |
| F10 | READY FOR M4 | Detached-input-wire voltage context; high-combustibles and platinum-pad branches referenced separately | §8.5.10 pp127–128 |
| F11 | READY FOR M4 | Recognize maximum-cell-resistance condition and replacement direction; numeric maximum absent | §8.5.11 pp128–129 |
| F12 | READY FOR M4 | Power-up after EEprom-change branch; running-hardware alternative referenced separately | §8.5.12 pp129–131 |
| F13 | READY FOR M4 | Gas/parameter check and two page-132 examples, exclusively in Fault 13 context | §8.5.13 pp131–133 |
| F14 | READY FOR M4 | Last calibration procedure review and cell-replacement direction; no constant calculation | §8.5.14 pp133–135 |
| F15 | READY FOR M4 | Previous-calibration retention and corrective reference; combined predicate blocked | §8.5.15 pp135–137 |
| T16 | READY FOR M4 | Heater-not-open setpoint case; identify Auto Tune → No; no computed process-temperature trigger | §8.6 p137 |
| T17 | READY FOR M4 | External leakage paths: cap/valve, shield/flange gasket, tubing and cell seal | §8.7.1 pp138–139 |
| T18 | READY FOR M4 | Internal reference-leak direction check, tube and single-use seal | §8.7.1 pp138–139 |
| T19 | READY FOR M4 | Trend, flow and recovery evidence for possible plugging; no upward flow compensation | §8.7.2 pp139–140; §9.2.2 p143 |
| T20 | PARTIALLY SUPPORTED | Temporary badly-plugged-diffuser calibration procedure shown only as reference; changing flow/mixing response is not modeled | §8.7.2 p140; M0 G19/G14 |
| T21 | READY FOR M4 | Removed ceramic diffuser inspection and damage/replacement direction; distinguish damage from plugging | §9.3.10 pp161–162 |

Totals: **20 READY, 1 PARTIALLY SUPPORTED, 0 wholly BLOCKED scenarios**. Blocked fields/behaviors still exist within the bounded READY scopes and cannot execute. T20 is excluded from both manual scenario selection and challenges. Line-frequency and historical calibration-recommended records remain informational.

## Virtual multimeter scope

Only the active check's source-backed location and mode can be used. It is not a free probe-placement or electrical simulator. Wrong mode, wrong check or missing prerequisites are training errors.

| Context | Source-backed result / comparison |
| --- | --- |
| F1, TP3+/TP4− | 1.2 Vdc ±0.1 Vdc |
| F1, disconnected red/yellow leads | Qualitative OPEN scenario condition; intact-lead reference approximately 1 ohm |
| F2, TP3+/TP4− voltage | 0 ±0.5 mV |
| F2, J1 disconnected, board-side TP3+/TP4− | Approximately 20 kΩ |
| F3, TP3+/TP4− | NEGATIVE, with no invented magnitude |
| F5, isolated J8 | Qualitative OPEN condition; good-heater comparison approximately 72 ohms |
| F8, isolated J8 | Qualitative OPEN condition; separate good-heater comparison approximately 70 ohms |
| F10, TP1+/TP2− | 1.2 Vdc detached-input context; alternative 104 mV–1 Vdc high-combustibles range is a reference only |
| F13, TP1+/TP2− at 8% example | 23 mV, page 132 only |
| F13, TP1+/TP2− at 0.4% example | 85 mV, page 132 only |

Good/intact reference resistances are explicitly distinguished from the selected open-circuit condition. No fabricated infinity value, tolerance, noise, Ohm's-law computation or universal conversion is used. Checks without a documented meter value use inspection/source-review mode and keep the numeric field blocked.

M3-G01 remains unresolved: the page-132 23/85 mV examples do not replace Table 8-1's 21.1/86.3 mV points. The existing twenty-point lookup and all its tests are unchanged.

## Guided, practice and challenges

Guided mode shows the next documented check and the source interpretation to examine. Practice hides that guidance. Each decision offers up to three choices drawn from documented checks, diagnoses or corrective directions. Distractors are other source-backed actions; wrong choices are rejected without fabricated device consequences.

Full selected-choice text and source references are available below long native selects, including on narrow screens. Error counts concern procedural choices only; no time, physical-accuracy, condition or probability score exists.

Manual selection supports reproducible exercises. Random challenges select only one READY scenario ID; they never randomize measurements, thresholds, coefficients, fault combinations or physical conditions.

## No-alarm reasoning

T17 does not assert that every high reading is a leak. It teaches why successful calibration does not exclude process-side air ingress and follows the actual documented inspection locations. T18 preserves the qualitative internal-reference check: an increase indicates leakage; an intact case should decrease slightly. No percentage change is invented.

T19 uses the combination of smoother trend, slower response, lower calibration flow and longer recovery, not simply “low O₂ = plugging.” The caution against increasing flow is retained. T21 separately teaches that damaged ceramic elements may also slow response.

T16 presents the supplied case and Auto Tune recommendation without evaluating process temperature or simulating the heater.

## Safety and source inspection

Manual safety context remains visible beside diagnostic actions: qualified/trained access, hazardous voltage and power removal, hot surfaces, housing/hazardous-area restrictions, specified waiting periods, protective covers and grounds, probe removal and cooling before service. Specific resistance/disconnection or restart prerequisites are presented before the relevant check and explicitly acknowledged. Corrective-action identification has its own service-safety acknowledgment.

This is educational context, not a live-work authorization or complete service procedure. The trainer stops at selecting the source's corrective direction and does not compress an actual physical repair into a successful animation.

Every scenario, observation, measurement and corrective action exposes manual/revision, section, PDF page, evidence ID and figure/table when available. Fault number and its source fields are shown for numbered scenarios. New evidence records add direct safety, no-alarm and service-section references without modifying M1's registry.

The selected component is linked to the original M2 cutaway on load and via a highlight control. The schematic is explicitly not exact service-access geometry. On mobile the active diagnostic and actions precede the diagram/reference sections.

## Source conflicts and blocked behavior

Preserved: G06 Fault 9 current; G08 combined calibration predicate; M3-G01 differing mV contexts; F1's blank service cross-reference; Fault 3 wording variants; fault-specific pauses and heater-resistance references. No precedence or numeric reconciliation was introduced.

Continuous O₂/EMF, interpolation/extrapolation, normal analog mapping, thermal dynamics, generalized meter/TP conversions, calibration mathematics, aging, combined faults, priorities and undocumented recovery remain blocked. No new M0 decision is silently assumed.

## Validation

- Full suite: **214/214 passed** (all 180 prior tests plus 34 M4 tests).
- Every READY engine path tested, including fault identity/LOI/LED/self-clear references, meter contexts, prerequisites, wrong actions, source provenance, output restrictions, no-alarm reasoning, deterministic challenges and retained indications after completion.
- **M2 browser acceptance passed unchanged.**
- **M3 browser acceptance passed unchanged.**
- **M4 browser acceptance passed:** full keyboard-only thermocouple exercise; heater F5; cell F10; calibration F13; external/internal leakage T17/T18; plugged diffuser T19; setpoint T16; guided/practice; virtual meter; source inspection; blink pause; wrong check/meter; challenge selection; component linking.
- Layout/screenshots at **1440, 430, 390, 320 px**: no horizontal overflow with references collapsed or expanded, minimum 44 px native controls, no fixed/sticky overlays, reduced-motion checked, no browser errors. A complete practice diffuser journey was also performed at 320 px.
- Diagnostics navigation is disabled during active M3 calibration so it cannot bypass calibration cleanup.
- Desktop/mobile screenshots and meter/no-alarm views visually inspected. Tests used local Chromium; no claim of real-device, screen-reader or cross-browser certification.
- Hub check: in sync. Syntax checks for all working `.mjs` files passed. `git diff --check` passed; all untracked text checked separately for trailing whitespace.

Reproduce from the repository root:

```sh
npm --prefix site-tests test
node scripts/build-hub.mjs --check
CHROMIUM_PATH=/path/to/chromium NODE_PATH=/path/to/node_modules node site-tests/oxymitter-4000-m4-browser.mjs
```

The browser path may be omitted when Playwright's browser is installed. This environment used `/tmp/chromium`. Reproducible QA screenshots default to `/tmp/oxymitter-m4-screenshots`; override using `OXYMITTER_M4_SCREENSHOTS`.

## Traceability counts

| Measure | Result |
| --- | --- |
| M1 inherited SUPPORTED records | 222, unchanged |
| M3 procedure/reference/scenario SUPPORTED records | 40, unchanged |
| New M4 SUPPORTED records | 156 |
| M4 blocked records | 39: numeric-extension/missing-meter metadata with no executable value |
| Executable DERIVED technical values | **0** |
| Executable UNSUPPORTED technical values | **0** |

M4 counts cover its safety/scenario/check/action fixtures, excluding the reused M1 fault identities and evidence registry. Counts are records, not claims that all source references execute device behavior. Supported readers reject blocked records. Selection, stage progression, procedural error counting and symbolic blink steps are training infrastructure, not derived physical models.

## Final Git/publication status

Branch and HEAD unchanged. Twenty-five expected untracked files: nineteen inherited files plus six M4 files. Exactly four inherited working files extended as listed above. No tracked modifications and nothing staged.

No public catalog entry, production navigation/homepage link, stage, commit, push, PR, merge or deployment. No Firebase, hosting, workflow, repository-setting or production-data changes.

Ready for owner review. Work stops at M4.
