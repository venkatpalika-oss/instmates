# Oxymitter 4000 — M3 source-grounded calibration training

M3 is implemented and locally validated for the supported procedural scope. No calibration mathematics or production integration is added. The unresolved keypad initiation sequence is intentionally excluded: keypad exercises begin from a clearly labeled Gas 1 readiness fixture, while LOI training includes initiation.

## Baseline

- Branch: `feature/simulations-catalog-v2`
- Starting/final HEAD: `929f4ce14648c1564a7b007de7bff8df3021901e`
- Preflight: exactly thirteen expected untracked M1/M2 files, no tracked modifications and no unexpected files. No reset, clean or deletion.
- Preflight tests: 157/157 passed; hub in sync.
- Authority: supplied Rosemount 00809-0100-4340 Rev AE, November 2024, plus approved M0/M1/M2. Chapter 9 procedures were checked against extracted text and rendered PDF pages 146–147. No external technical sources used.

## Files and integrity

Six files created:

| File | Purpose |
| --- | --- |
| `simulator-foundations/oxymitter-4000/calibration-data.mjs` | Supported procedure/state/transition/scenario facts and blocked source gaps |
| `simulator-foundations/oxymitter-4000/calibration-engine.mjs` | Procedural engine, logical timing, symbolic retention, exact-example selection |
| `simulator-foundations/oxymitter-4000/dev/calibration-page.mjs` | Guided/practice calibration workspace |
| `site-tests/oxymitter-4000-m3.test.mjs` | 23 new automated tests |
| `site-tests/oxymitter-4000-m3-browser.mjs` | Isolated Playwright acceptance |
| `docs/29-oxymitter-4000-m3.md` | This report |

Four existing M2 working files extended:

| File | Change |
| --- | --- |
| `simulator-foundations/oxymitter-4000/dev/index.html` | Local workspace selector, calibration panel/module, milestone wording |
| `simulator-foundations/oxymitter-4000/dev/page.mjs` | Export the existing startup instance for the calibration prerequisite; startup logic unchanged |
| `simulator-foundations/oxymitter-4000/dev/style.css` | Responsive calibration presentation; no fixed overlays |
| `scripts/serve-oxymitter-dev.mjs` | Allowlist the three new runtime modules |

All five M1 files are byte-identical to preflight, including fixture, provenance, engine and tests. Both M2 test files, M2 view-model and prior completion reports are byte-identical. No test weakened. The four intended M2 changes above account for every baseline checksum difference.

## Local review

From the repository root:

```sh
node scripts/serve-oxymitter-dev.mjs
```

Open `http://127.0.0.1:4174/simulations/oxymitter-4000/`. Apply power, complete logical startup, then select Calibration training. Choose the interface/scenario/output mode, place the simulated loop in MANUAL and verify parameters before starting.

Everything remains outside Firebase's public folder. The preferred route is provided only by the loopback development server. No production navigation or catalog link exists.

## Procedure, states and provenance

Every engine state and logged procedure transition references the unchanged M1 evidence registry. The source inspector shows manual/revision, section, PDF pages and figure/table where available.

| State | Documented action/indication | Evidence |
| --- | --- | --- |
| NORMAL / READY | Startup prerequisite, loop MANUAL, gas parameters verified | E67, E69 |
| APPLY GAS 1 | Apply configured first gas; CAL flashing; LOI Apply Gas 1 / Hit E when ready | E69, E71 |
| FLOW / READ GAS 1 | CAL or ENTER acknowledgment; solid CAL; logical gas period | E69, E71 |
| APPLY GAS 2 | Done Gas 1; remove first gas and apply second; CAL flashing | E69, E71 |
| FLOW / READ GAS 2 | CAL or ENTER acknowledgment; solid CAL; second logical gas period | E69, E71 |
| RESULT / STOP GAS | Pre-authored result; remove gas and cap port | E69, E70, E71 |
| PURGE | Solid CAL for ordinary completion; complete documented purge | E69, E71 |
| NORMAL | Hold released, placeholder measurement, explicit loop return to AUTOMATIC | E69, E71 |
| ABORT / REMOVE GAS | Abort retains prior good; gas removal and purge cleanup | E68, E71 |

Gas-applied, port-capped and loop flags track operator actions within these states. They are not extra device substates. Startup remains the original independent M1 engine; M3 requires its NORMAL OPERATION state and does not alter its technical model.

## Keypad and LOI

**LOI:** CALIBRATION → Start Calibration, Apply Gas, grouped Flow/Read, Done Gas, Stop Gas and Purge. ENTER advances only at the documented acknowledgment points. No unrelated menu branches or copied screenshots.

**Keypad:** CAL advances the gas and purge acknowledgments; CAL activity shows OFF, SOLID, FLASHING, TWO-PATTERN FLASH or THREE-PATTERN FLASH as supported. Patterns are textual, without an invented flashing cadence. Step guidance is an educational readout, not a fabricated keypad display.

M0 G05 remains blocked: p146 initial arming still references the discontinued CALIBRATION RECOMMENDED behavior. No ARMED state, legacy recommendation LED or automatic recommendation trigger is executed. The user explicitly loads a keypad Gas 1 readiness scenario, and its limited entry point remains visible. This is not represented as a complete firmware initiation path.

INC/DEC gas keys remain read-only because M0 G10 does not specify increments/repeat/rounding. The separate training inputs validate the documented gas ranges without emulating those editing keys.

## Gases, logical timers and abort

- Low/high ranges and typical pair come directly from M1: low 0.4–2%, high 8–21%, balance nitrogen; typical 0.4%/8%. Either may be Gas 1.
- Gas 2 application explicitly represents removing Gas 1 and applying the other configured gas.
- The flow caution is visible and explicitly acknowledged. Only new-diffuser flow resetting is taught; no adjustable flow/pressure or plugging model is implemented.
- Rejected setup invalidates previous verification, so stale accepted values cannot silently start an exercise.
- Default gas period: M1's 300 seconds. Gas application wait: M1's 30 minutes. Purge: M1's 3 minutes. Seconds conversions are training-clock infrastructure.
- +30 seconds, +1 minute and complete-current-timer controls advance logical time. Excess advancement does not spill into the next operator step.
- Flow/Read remain grouped under M0's permitted grouped representation. Separate Read duration and allocation are unknown; the UI does not display a fabricated separate Read countdown.
- Application timeout operates while the requested gas has not been applied. It invokes the documented abort boundary, not an invented warning alarm.
- LOI uses Abort Calib. Keypad uses an explicitly labeled educational macro for the documented three CAL presses within three seconds; it does not pretend to measure browser click speed.
- Aborted sessions retain previous-good markers. Cleanup uses the documented gas-removal/purge return sequence; unspecified abort LED behavior is labeled accordingly. No partial coefficient updates or physical clearing assumptions.

## Results, retention, output and learning modes

Procedural completion is distinct from the device result. Only completion of the required sequence, purge and loop return without rejected actions produces **TRAINING PROCEDURE COMPLETE**. Rejected actions produce **TRAINING ACTION NOT ALLOWED**, with the expected step, and leave a procedural-error record. They do not generate analyzer alarms. Abort cleanup is reported separately.

Three device scenarios are explicitly pre-authored: valid, invalid slope, and invalid without a diagnostic alarm. Gas concentration does not determine the scenario result. The invalid-slope fixture displays the existing F13 diagnostic description through purge; no general fault engine or combined slope/constant predicate is created.

Calibration records are symbolic labels, never coefficients. A valid completed scenario moves the prior-good marker to previous and accepts a new symbolic current marker. Invalid/aborted scenarios do not load failed values. A new training exercise resets the educational session rather than representing a hardware reset.

TRACK and HOLD are qualitative labels only. No calibration-gas mA is calculated and no held numeric mA is invented. Normal mapping stays blocked after purge.

TP5/TP6 returns only the two existing source examples: 8% → 8 Vdc and 0.4% → 0.4 Vdc. Other allowed gas settings explicitly report that no exact numerical value exists in the current source model. These are reference examples, not dynamic readings.

Guided mode supplies source-linked next-step guidance; Practice hides it. Both enforce the same documented procedure. No scoring of physical accuracy is attempted.

## Sequencer overview and source boundaries

Semi-automatic/automatic modes are source-linked overviews of permanent piping, SPS 4001B/IMPS 4000, logic I/O modes, initiation, in-cal signaling and gas sequencing. No sequencer valves, handshake timings or internal diagnostics run.

Unresolved M0 gaps remain visible: G05 keypad arming/recommended feature; G10 gas-key increments; G14 separate Read/handshake timing; G08 calibration math/combined predicate; G15 conflicting HART return-to-auto wording; G16 supply/line pressure. This trainer follows Chapter 9's post-purge loop return; it does not implement the conflicting HART path.

Additional discrepancy recorded as **M3-G01**: troubleshooting p132 uses different example cell mV values from Table 8-1 pp107–108. They are not reconciled into a transfer function or used to change the approved M1 lookup. Source-context review would be needed before broader calibration mathematics.

Continuous O₂/EMF, interpolation/extrapolation, normal analog mapping, thermal behavior, generalized TP5/TP6 conversion, synthetic aging, slope/constant computation and calibration correction remain blocked. Full keypad initiation needs a G05 owner/source-scope decision; no decision is silently assumed in M3.

## Traceability

| Measure | Result |
| --- | --- |
| Inherited M1 SUPPORTED records | 222, unchanged |
| M3 SUPPORTED procedure/reference/scenario records | 40 |
| M3 blocked records | 9, including one reused M1 calibration-math record |
| Executable DERIVED technical values | **0** |
| Executable UNSUPPORTED technical values | **0** |

Counts are fixture records, not a claim that every reference fact executes device behavior. Only `readSupported` consumes source values. Blocked records have no executable value. UI layout, validation messages, symbolic history and logical unit conversion are educational infrastructure, not technical device derivations.

## Validation

- Full site suite: **180/180 passed** = 128 existing + 25 unchanged M1 + 4 unchanged M2 + 23 M3.
- New tests cover both interfaces/orders, prerequisites, rejected setup, state order, timers/timeouts, CAL/LOI indications, abort/cleanup, retained records, invalid fixtures, exact TP boundaries, qualitative output, source blocking and absence of solver/cadence code.
- Unchanged M2 browser acceptance passed again.
- M3 browser acceptance passed: complete LOI journey using only Tab/Enter; keypad high-first invalid-slope fixture; TRACK/HOLD; both abort mechanisms; application timeout; out-of-range gas rejection; procedural errors; non-example TP blocking; source/history inspection; completed mobile journey at 320 px.
- Chromium layout checks at **1440, 430, 390 and 320 px**: no horizontal overflow with references collapsed or expanded; native calibration buttons/selects/inputs at least 44 px high; no fixed/sticky overlays; reduced-motion mode checked; no page errors.
- Desktop/mobile screenshots plus LOI completion and keypad-invalid views were visually inspected. Configuration collapses during an active exercise to keep the instrument and actions closer to status.
- Hub check: in sync. JavaScript syntax checks and `git diff --check`: passed. New/untracked text also checked for whitespace issues.
- No lint/typecheck commands exist in this static repository. Validation used local Chromium, not real devices, screen readers or cross-browser certification.

Reproduce:

```sh
npm --prefix site-tests test
node scripts/build-hub.mjs --check
CHROMIUM_PATH=/path/to/chromium NODE_PATH=/path/to/node_modules node site-tests/oxymitter-4000-m3-browser.mjs
```

The test can use Playwright's installed browser when `CHROMIUM_PATH` is omitted. This environment used `/tmp/chromium`. Reproducible screenshots default to `/tmp/oxymitter-m3-screenshots`; set `OXYMITTER_M3_SCREENSHOTS` to change the location.

## Final Git/publication status

HEAD and branch unchanged. Nineteen expected untracked files: thirteen inherited M1/M2 files plus six M3 files; four inherited M2 files contain the extensions listed above. No tracked modifications and nothing staged.

No catalog entry, production navigation/homepage link, deployment, commit, push, PR or merge. No Firebase, hosting, workflow, repository settings or production-data changes. Stopped for owner review.
