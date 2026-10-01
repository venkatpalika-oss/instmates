# Oxymitter 4000 — M5 training experience and assessment checkpoint

M5 is implemented and locally validated for owner review. Six guided lessons connect the existing exploration workspaces to a deterministic knowledge-and-procedure assessment. The technical engines remain unchanged. This checkpoint is not milestone acceptance and does not authorize publication.

## Baseline

- Branch: `feature/simulations-catalog-v2`
- Starting/final HEAD: `929f4ce14648c1564a7b007de7bff8df3021901e`
- Preflight: exactly 25 expected M1–M4 untracked files, no tracked modifications, nothing staged and no unexpected files.
- Preflight suite: **214/214 passed**; hub in sync.
- Authority: supplied Rosemount manual 00809-0100-4340 Rev AE, November 2024, and approved M0–M4 artifacts.
- No reset, clean, deletion, baseline realignment or remote repository operation occurred.

## Files created and modified

Six new files:

| File | Purpose |
| --- | --- |
| `simulator-foundations/oxymitter-4000/training-data.mjs` | Six modules, 15 questions, four practical definitions, source audit |
| `simulator-foundations/oxymitter-4000/training-engine.mjs` | In-memory lesson/assessment orchestration and educational scoring |
| `simulator-foundations/oxymitter-4000/dev/training-page.mjs` | Training path, lessons, assessment, review and navigation guards |
| `site-tests/oxymitter-4000-m5.test.mjs` | 26 M5 tests, including inherited-file checksum integrity |
| `site-tests/oxymitter-4000-m5-browser.mjs` | Keyboard, complete assessment, mobile, review/retry/reset and guard validation |
| `docs/31-oxymitter-4000-m5.md` | This report |

Four inherited working files extended:

| File | Change |
| --- | --- |
| `dev/index.html` under the simulator foundation | Training host, error region, module script and M5 development label |
| `dev/style.css` under the simulator foundation | Training cards, action/source presentation, mobile result rows and return link |
| `dev/calibration-page.mjs` under the simulator foundation | Read-only `calibrationSnapshot()` export; existing code is otherwise unchanged |
| `scripts/serve-oxymitter-dev.mjs` | Allowlist the three new training modules on the existing loopback-only server |

## M1–M4 integrity

All five M1 files remain byte-for-byte unchanged. The M3 calibration engine/data and M4 diagnostic engine/data remain unchanged. The original M2 startup page controller and view model, M4 diagnostic page, every prior test/browser acceptance file, and reports 27–30 remain unchanged.

An automated checksum test compares 21 inherited immutable files against the M5 preflight hashes. Only the four intended UI/server extensions above differ. No prior test was weakened.

Assessment uses new instances of the existing engines so exploration progress is preserved. During assessment, the exploration workspaces are hidden and inaccessible through their normal navigation. This is session isolation in the training layer, not a new device model.

## Training modules and lessons

| Recommended order | Lesson | Interaction | Understanding check |
| --- | --- | --- | --- |
| 1 | Analyzer Fundamentals | Select/highlight an existing cutaway component | Identify in-situ measurement |
| 2 | Measurement Reference | Open the exact O₂/EMF reference bench | Read the 8% Table 8-1 point |
| 3 | Startup | Open the inherited startup workspace | Identify the exact LOI warm-up message |
| 4 | Calibration | Open the inherited calibration workspace | Identify pre-calibration preparation |
| 5 | Diagnostics | Open the inherited diagnostic workspace | Identify the Fault 2 LOI message |
| 6 | Troubleshooting | Open the inherited guided/practice workspace | Select the documented diffuser corrective direction |

Each lesson has an objective, concise source-backed explanation, interaction, submitted understanding check, source access and completion state. Opening/performing the lesson interaction is required before its answer can be submitted. A correct answer marks that lesson complete; a wrong answer can be reviewed and retried. Lesson completion is familiarity progress, not proof of successful practical work; practical performance is scored separately.

Fundamentals reuse all eleven component descriptions, including process gas, diffuser, YSZ cell, reference air, heater, thermocouple, electronics, local interface, analog/HART and separate logic I/O. Measurement reference includes the manual's Nernst expression and variable definitions as explanatory text only. PDF page 17 was checked directly; P1 is reference oxygen partial pressure and P2 measured-gas oxygen partial pressure. No solver or interpolation was added.

## Question bank and source audit

The assessment presents all 15 stable questions in a fixed order on every attempt. There is no randomization of technical values or question composition. Correct choices and distractors are supported datums from the existing approved material; component prose is inherited from the M2 view model. Numeric distractors retain their own source context and are not treated as correct facts for the question's context.

Every record contains ID, module, prompt, choices, correct answer mapping, explanation, evidence, difficulty and technical/procedural classification. Labels: 13 Foundation / 2 Applied; 10 technical / 5 procedural. These are educational labels, not certification difficulty.

The startup audit runs before the training UI can enable questions. It checks stable/unique identities, module membership, metadata, choice IDs, correct-choice equality, matching answer evidence, supported status and valid provenance for every answer/explanation/choice. Blocked, derived, missing-source or mismapped answers are rejected. Lessons and practical source datums are also validated with the inherited supported-only reader.

The audit verifies source structure and exact mapping to approved fixtures; it does not claim to automatically interpret the manual. Technical meaning was reviewed against those approved fixtures, with the additional page-17 check noted above.

| Question | Module | Correct-answer evidence |
| --- | --- | --- |
| OX-Q01 | fundamentals | E01 |
| OX-Q02 | fundamentals | E60 |
| OX-Q03 | fundamentals | E03 |
| OX-Q04 | reference | E65 |
| OX-Q05 | reference | E03 |
| OX-Q06 | startup | E52 |
| OX-Q07 | startup | E40 |
| OX-Q08 | calibration | E69 |
| OX-Q09 | calibration | E69 |
| OX-Q10 | calibration | E71 |
| OX-Q11 | diagnostics | F02 |
| OX-Q12 | diagnostics | F05 |
| OX-Q13 | troubleshooting | F01 |
| OX-Q14 | troubleshooting | D19 |
| OX-Q15 | troubleshooting | DSAFE |

## Practical assessments

| Practical | Existing engine and bounded task | Completion boundary |
| --- | --- | --- |
| Startup | M1: apply power, then complete the documented logical warm-up milestone | NORMAL OPERATION; no live temperature or O₂ prediction |
| Calibration | M3: loop MANUAL, parameter verification, LOI start, two gases, acknowledgment/timers, removal/capping, purge, AUTOMATIC | Completed procedure and loop restored; no slope/constant calculation |
| Diagnostics | M4 Fault 2: manually step the flashes and documented pause, then identify the fault from LED/LOI | Correct indication identification; no physical recovery |
| Troubleshooting | M4 READY T19: choose check, acknowledge safety, inspect the source observation, diagnose and identify corrective direction | Documented corrective action identified; no dynamic plugging or recovery |

Calibration begins from a NORMAL OPERATION readiness fixture constructed through the unchanged startup engine; the separate startup practical has already been completed. Gas 1 is the inherited typical 0.4% gas, Gas 2 the inherited 8% gas. A valid result is explicitly pre-authored, not calculated. Question OX-Q13 separately tests the exact Fault 1 test-point/meter context.

Wrong practical actions record educational errors without fabricating alarms or physical consequences. Calibration sequence validation belongs to the training wrapper; M3 semantics are not modified. Abort remains available, but removal/capping, purge and AUTOMATIC cleanup are still required. An aborted calibration earns no practical point and is not counted as a completed calibration, even after successful cleanup.

## Scoring, review and retries

Scoring is explicitly **educational infrastructure**:

- One point per correct first-submitted knowledge answer: 15 available.
- One point per completed practical with zero inappropriate choices: four available.
- Maximum: 19 points. No pass threshold is used.
- Practical completion and practical points are reported separately.
- No speed, physical-response, accuracy, probability, equipment-condition or inferred-performance score exists.

Answers/source help are concealed in the active question UI until submission. The first submitted answer is retained for scoring. Feedback then shows the learner answer, correct answer, explanation and source. The final review adds practical action histories, accepted/rejected choices, documented sequences and direct sources.

Results include points, knowledge correct/total, procedural exercises completed, per-module breakdown and links to weak modules. Retry clears the assessment attempt while preserving lesson progress. Results explicitly state: **This result reflects performance in this educational simulator only.** No certified/qualified/authorized/live-work competency status is awarded.

## Session progress and navigation

Lesson progress, answers, errors and results live only in JavaScript memory. No backend, account, analytics, cookie, browser storage or cloud persistence was added. Refresh clears progress. The explicit **Reset training session** control refreshes this educational page, clearing both exploration and training state; it is not presented as a real Oxymitter reset.

Home/module changes and new assessments are blocked while inherited calibration is active or still needs loop restoration. The capture guard also protects the interval after purge but before AUTOMATIC. Reset remains unavailable while either assessment or exploration calibration requires cleanup. During an active assessment, changing lessons/home is blocked; an educational reset is possible only when calibration cleanup is not outstanding.

The existing engine fault/scenario boundaries are preserved. The training wrapper does not expose combined faults, T20, arbitrary meter inputs or calculated measurements.

## Safety coverage

Safety understanding includes loop preparation (OX-Q08), gas removal/capping before purge (OX-Q09), the supported Fault 1 meter context (OX-Q13), diffuser flow caution (OX-Q14) and service precautions (OX-Q15).

Practical calibration shows loop/gas verification and flow/abort cleanup cautions. Diagnostic identification uses a source-review boundary. Troubleshooting keeps its contextual prerequisites and service warning visible before the learner identifies the corrective direction. Prior M4 warning presentation remains unchanged. No warning needed for an active action is hidden in a disclosure.

## UX, mobile and accessibility

The local page now has a common training path, module objectives, lesson progress, assessment status, results and return navigation. The exploration workspaces remain directly available below the training path outside assessment. A nearby return link leads back to training without resetting a device session.

Assessment keeps its current module/state, observation, safety context and primary action together. Secondary sources/results use disclosures. Native controls, text status, visible focus, a status region and error alerts support keyboard operation. Focus is restored after training updates. Full selected action text is displayed below long practical selects.

Home cards collapse to one column on mobile. Module results become labeled stacked rows at narrow widths instead of cramped table columns. No fixed or sticky overlay was introduced.

## Preserved technical blocks

Continuous O₂/EMF, interpolation/extrapolation, generic Nernst solving, normal analog mapping, physical heater dynamics, generalized test-point conversion, calibration mathematics, synthetic aging, combined faults, undocumented priority/recovery, keypad initiation, M3-G01 reconciliation and T20 flow/mixing remain blocked.

The Nernst expression is reference text only. Assessment totals, sequence indices, error counts and lesson states are educational computations; they are not derived device values. No source gap was closed during M5.

## Validation results

- Full site suite: **240/240 passed** — all 214 inherited tests plus 26 M5 tests.
- M5 tests cover source audit failures, stable mapping, lesson progression, concealed answers, first-submission scoring, deterministic results, weak modules, retries/reset, all four practicals, wrong-action behavior, abort cleanup/completion accounting, action/source review, navigation guards, absence of persistence/public route and inherited checksum integrity.
- **M2 browser acceptance passed unchanged.**
- **M3 browser acceptance passed unchanged.**
- **M4 browser acceptance passed unchanged.**
- **M5 browser acceptance passed:** guided lesson, component interaction, knowledge submission, all 15 assessment questions and all four practicals completed using only keyboard controls at 320 px, result review, retry with a wrong answer, educational reset, and inherited calibration cleanup/navigation guards.
- Home and results checked at **1440, 430, 390 and 320 px**; practical/question overflow checked through the complete 320 px journey. Screenshots reviewed for desktop home, mobile calibration and mobile results.
- No horizontal overflow, fixed/sticky overlay, obscured active control or browser error was observed. Native training controls meet 44 px minimum height. Reduced-motion preference was checked. No external requests or browser storage writes occurred.
- Hub check: in sync. All working `.mjs` syntax checks passed. `git diff --check` passed; all untracked text also checked for trailing whitespace.
- Validation used local headless Chromium. Real-device, screen-reader and cross-browser certification are not claimed.

Reproduce from the repository root:

```sh
npm --prefix site-tests test
node scripts/build-hub.mjs --check
CHROMIUM_PATH=/path/to/chromium NODE_PATH=/path/to/node_modules node site-tests/oxymitter-4000-m5-browser.mjs
```

This environment used `/tmp/chromium` and the runtime's Playwright installation. QA screenshots are generated under `/tmp/oxymitter-m5-screenshots`.

## Traceability

| Measure | Count |
| --- | --- |
| Guided modules / lessons | 6 |
| Lesson source-datum references | 32 |
| Stable questions | 15 |
| Question answer/explanation/choice SUPPORTED records audited | 74 |
| Practical exercises | 4 |
| Practical source-datum references | 14 |
| Executable DERIVED technical values | **0** |
| Executable UNSUPPORTED technical values | **0** |

Counts include reused references and are not claims of 120 distinct new technical facts. M1/M3/M4 data and their traceability counts remain unchanged. The question bank introduces no unsupported executable answer. Engineering constants, measurements, thresholds and device behavior remain in their inherited source contexts.

## Final Git and publication status

Branch and HEAD unchanged. **31 expected untracked files**: 25 inherited plus six M5 files. Four inherited working files extended as listed above. No tracked modifications; nothing staged.

No public catalog registration, public navigation/homepage CTA, commit, push, PR, merge or deployment. No Firebase, hosting, workflow/settings or production-data changes.

**Ready for owner review. Work stops at M5.**
