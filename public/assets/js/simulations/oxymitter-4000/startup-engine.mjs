import { SOURCE_DATA } from './source-data.mjs';
import { deepFreeze, readSupported } from './provenance.mjs';

const truth = datum => readSupported(datum, SOURCE_DATA.evidence);
const supported = SOURCE_DATA.startup;
const warmupSteps = truth(supported.warmupLedSteps);
const normalSteps = truth(supported.normalLedSteps);

/** Logical infrastructure, NOT a thermal model or a real LED timebase.
 * Time is advanced explicitly, never from a browser timer. The approximate
 * manual duration is used as an authorized educational completion milestone.
 * Indication steps advance independently: the manual specifies order, not pace.
 */
export function createStartupEngine({ startupOutputMa = truth(SOURCE_DATA.operating.startupOutputDefault) } = {}) {
  if (!truth(SOURCE_DATA.operating.startupOutputChoices).includes(startupOutputMa)) throw new RangeError('Unsupported startup output selection.');
  let state = 'POWER OFF';
  let elapsed = 0;
  let indicationStep = 0;
  let fault = null;
  // Unit conversion for the test clock; no additional device equation.
  const warmupSeconds = truth(SOURCE_DATA.operating.warmupApproximate) * 60;

  function snapshot() {
    const warm = state === 'WARM UP';
    const normal = state === 'NORMAL OPERATION';
    const error = state === 'FAULT INDICATION';
    return deepFreeze({
      device: {
        state,
        stateSource: state === 'POWER OFF' ? supported.powerRemoved.source : error ? supported.startupFault.source : normal ? supported.operatingReached.source : supported.powerApplied.source,
        // ON is explicitly documented at power application. No heat/cooling
        // assertion is made for off, normal, or fault-boundary states in M1.
        heater: warm ? { status: 'ON', source: supported.powerApplied.source } : { status: 'NOT MODELED' },
        membrane: {
          mode: warm ? 'WARM_UP_SEQUENCE' : normal ? 'NORMAL_SEQUENCE' : error ? 'FAULT_BOUNDARY' : 'NOT MODELED',
          litDiagnosticLeds: warm ? warmupSteps[indicationStep] : normal ? normalSteps[indicationStep] : null,
          source: warm ? supported.warmupLedSteps.source : normal ? supported.normalLedSteps.source : null,
          // No blink pulse timing, CAL activity, or historical recommendation.
        },
        loi: {
          mode: warm ? 'WARM UP' : normal ? 'O2 DISPLAY' : error ? 'ALARM' : 'NOT MODELED',
          text: warm ? truth(supported.loiWarmup) : error ? truth(fault.loiMessage) : null,
          oxygenPercent: null,
          readingAvailability: 'MEASUREMENT NOT IMPLEMENTED',
          source: warm ? supported.loiWarmup.source : normal ? supported.loiNormal.source : error ? fault.loiMessage.source : null,
        },
        analogOutput: warm ? { status: 'SUPPORTED', value: startupOutputMa, unit: 'mA', source: SOURCE_DATA.operating.startupOutputChoices.source } :
          { availability: 'BLOCKED', reason: normal ? 'G02: normal analog mapping not implemented' : 'Output not modeled at this boundary' },
        reportedFaultId: fault?.id ?? null,
      },
      infrastructure: {
        elapsedLogicalWarmupSeconds: elapsed,
        educationalWarmupMilestoneSeconds: warmupSeconds,
        approximateManualDuration: true,
        indicationStep,
        indicationCadence: 'NOT SPECIFIED IN SOURCE MANUAL',
        completionPolicy: 'Educational elapsed-time milestone; not measured cell temperature',
        faultPolicy: 'Explicit externally reported condition; no trigger, clearing or priority model',
      },
    });
  }

  function applyPower() {
    if (state !== 'POWER OFF') throw new RangeError('Power is already applied.');
    state = 'WARM UP'; elapsed = 0; indicationStep = 0; fault = null;
    return snapshot();
  }

  function advanceLogicalTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Logical time must be finite and nonnegative.');
    if (state !== 'WARM UP') throw new RangeError('Logical warm-up time advances only during WARM UP.');
    elapsed = Math.min(warmupSeconds, elapsed + seconds);
    if (elapsed >= warmupSeconds) { state = 'NORMAL OPERATION'; indicationStep = 0; }
    return snapshot();
  }

  function advanceIndication() {
    if (!['WARM UP', 'NORMAL OPERATION'].includes(state)) throw new RangeError('No active indication sequence.');
    const steps = state === 'WARM UP' ? warmupSteps : normalSteps;
    indicationStep = (indicationStep + 1) % steps.length;
    return snapshot();
  }

  function reportStartupFault(id) {
    if (state !== 'WARM UP') throw new RangeError('Only the startup error boundary is implemented in M1.');
    const record = SOURCE_DATA.faults.find(f => f.id === id && !f.historicalOnly);
    if (!record || record.loiMessage.status !== 'SUPPORTED') throw new RangeError('Unknown or historical fault.');
    if (fault) throw new RangeError('Multiple-fault priority is not implemented.');
    fault = record; state = 'FAULT INDICATION'; indicationStep = 0;
    return snapshot();
  }

  function removePower() {
    state = 'POWER OFF'; elapsed = 0; indicationStep = 0; fault = null;
    // Clearing an externally reported marker is infrastructure cleanup;
    // it does not claim that a physical fault has been repaired.
    return snapshot();
  }

  return Object.freeze({ snapshot, applyPower, advanceLogicalTime, advanceIndication, reportStartupFault, removePower });
}
