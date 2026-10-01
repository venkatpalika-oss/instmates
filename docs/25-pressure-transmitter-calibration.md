# LAB 02 — Pressure Transmitter Calibration

Base: 09c71893e9ded7be2fc8e65ca175ddc1af921347. Local implementation for review.
Route: /simulations/pressure-transmitter-calibration/.

## Boundary and interpretation

A native ES module lab, not a framework or manufacturer procedure. Bar gauge is
the only unit; positive-pressure bench 0–100 bar. No vacuum/absolute-pressure,
HART, uncertainty/certificate, pump dynamics, random noise, hysteresis, persistence,
authentication, Firestore, external images or runtime dependencies. Gauge ranges
with suppressed zero are supported. Negative/elevated-zero ranges require a
separate vacuum-capable bench extension. Homepage and LAB 01 model/controller/
CSS are unchanged. Learning pages use the existing public-learning opt-out.

The source request and source-applied pressure are separate model values.
Application error is a deterministic −0.2 bar source deviation, floored at zero.
Ideal reference measures that actual pressure, also present at the transmitter;
there is no fictitious steady-state pressure drop across this shared manifold.
Expected current ALWAYS uses measured reference pressure, not requested target.

## Model

Required range L,U; configured range Lc,Uc, each finite with upper > lower.
Expected = 4 + 16*(reference-L)/(U-L).
x = reference normalized to configured range.
Raw measured = 4 + z + a + 16*(1+g+b/100)*x + n*4*x*(1-x).
z and a are mA offsets; g is fractional device gain error; b is learner gain
correction in percent. n is midpoint nonlinear deviation in mA. This polynomial
is a deterministic teaching response, not firmware or a universal sensor model.

Measured output clamps to 3.8–20.5 mA (explicit teaching convention). Saturation
is reported; educational adjustments are disabled while the current result is
saturated. Expected remains unclamped. Error = measured − expected. % output-span
error = error/16*100. Default exercise tolerance ±0.5% = ±0.080 mA. Comparisons use
unrounded values with 1e-12 mA arithmetic epsilon; display current to 3 decimals.

Scenarios: normal; z=.16; g=.01; z=.16/g=.01; n=.16; configured 0–20 versus
required 0–10; application −.2 bar. Normal up/down readings coincide.

## Runs and controls

Nine observations: 0/25/50/75/100 upscale, 75/50/25/0 downscale. Single turnaround.
Record enabled only within ±0.1% required PRESSURE span of the nominal target;
this window is separate from output-error tolerance. Records include direction,
percent, target/reference, expected/measured, both errors, tolerance, result,
revision and saturation. Immutable frozen row/array snapshots retain evidence.
No incomplete or invalidated run receives an overall pass.

Configured/required range, tolerance and adjustment edits increment revision.
Edits invalidate partially recorded runs. Restart retains their evidence under
Earlier retained runs. Completed as-found stays locked. A correction revision
must follow as-found before starting an empty as-left run. As-left requires all
nine new observations. Further edits retain earlier as-left results as history.
Changing scenario loads default range/settings for a new exercise and retains
previous recorded evidence in history. Reset Entire Exercise intentionally
clears everything. Reset Adjustments clears corrections, retaining as-found and
invalidating a partial recheck. No real-time timestamps or fabricated certificates.

Educational zero/span are transparent additive/gain controls, available after
complete as-found and only with matching configured/required ranges. A range
edit resets corrections so wrong configuration cannot be masked by trim.
Correction of configuration enables a new as-left run. Nonlinear residuals are
not removed by endpoint correction.

Six deterministic challenges preserve pressure/record controls, conceal scenario
identity and coefficients, and reveal feedback after a diagnosis is submitted.
Exit restores prior state, records, history and revision. Challenge adjustments
are hidden; these challenges teach diagnosis rather than manufacturer trim.

## Presentation and catalog

Original local generic hand-pump and Reference Pressure Calibrator SVGs; existing
transmitter SVG reused. Shared pressure manifold is distinct from a closed
power/transmitter/series-current electrical path. Readings and record button are
in the same control panel. Mobile uses result cards, jump links and ordinary
flow, without fixed overlays. Native inputs, focus outlines, debounced live
summary, invalid-input alert, reduced motion and semantic result lists.

Registry adds explicit lab identifiers/topic coverage. Catalog counts and badges
are derived from published entries. LAB 02 appears once under Calibration &
troubleshooting; Pressure topic coverage also acknowledges it. Future categories
remain non-linked coming-soon topics. Homepage continues to feature LAB 01.

## Validation

Baseline site: 104/104. Added 16 model tests; site total 120.
Existing browser gates: 28 LAB 01 and 21 Homepage checks.
New browser harness covers run lifecycle, fault points, missed pressure target,
configuration invalidation, immutable records, six challenges/restoration,
320/360/390/430/768/1440 layouts, focus geometry, 44px controls, 200% text reflow,
reduced motion, local images, catalog, axe desktop/mobile and runtime/resources.

Commands (browser dependencies installed outside repo):

    npm --prefix site-tests test
    node scripts/build-hub.mjs --check
    CAL_CHROMIUM_PATH=/tmp/home-chromium CAL_AXE_MODULE=/tmp/home-production-tools/node_modules/@axe-core/playwright node site-tests/pressure-calibration-browser.mjs
    SIM_CHROMIUM_PATH=/tmp/home-chromium SIM_AXE_MODULE=/tmp/home-production-tools/node_modules/@axe-core/playwright node site-tests/simulations-browser.mjs
    HOME_CHROMIUM_PATH=/tmp/home-chromium HOME_AXE_MODULE=/tmp/home-production-tools/node_modules/@axe-core/playwright node site-tests/homepage-browser.mjs

Browser tests use localhost and block external requests. Screenshots/results are
outside the repository. Axe scope for new lab is main content; no manual screen
reader, physical device, Firefox or Safari certification. Two hundred percent
text reflow is emulated, not a physical-device keyboard test.

Technical distinctions informed by:
- https://www.fluke.com/en-vn/learn/blog/calibration/how-simplify-maintenance-hart-pressure-transmitter
- https://www.beamex.com/resources/what-is-calibration/
- https://blog.beamex.com/hysteresis-in-pressure-calibration
