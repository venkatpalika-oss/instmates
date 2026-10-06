/** Approved educational composition-only method. No ISO-conformity or uncertainty claim. */
const components = ['methane', 'ethane', 'nitrogen'];
const constants = Object.freeze({methane: 16.0425, ethane: 30.0690, nitrogen: 28.0134});
const scaledConstants = [160425n, 300690n, 280134n];
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const positiveId = n => Number.isSafeInteger(n) && n > 0;
const tick = n => Number.isSafeInteger(n) && n >= 0;
// Decimal semantics use the canonical decimal spelling of each finite Number.
// Integer arithmetic prevents binary floating-point error from reversing exact decimal ties.
function fraction(decimal) {
  const [mantissa, exponent = '0'] = String(decimal).toLowerCase().split('e');
  const [whole, digits = ''] = mantissa.split('.');
  const scale = digits.length - Number(exponent);
  return scale >= 0 ? [BigInt(whole + digits), 10n ** BigInt(scale)]
    : [BigInt(whole + digits) * 10n ** BigInt(-scale), 1n];
}
function rounded(numerator, denominator) {
  const scaled = numerator * 1000n;
  const units = scaled / denominator + ((scaled % denominator) * 2n >= denominator ? 1n : 0n);
  return `${units / 1000n}.${String(units % 1000n).padStart(3, '0')}`;
}
export function formatDecimalHalfUp(decimal) {
  if (typeof decimal !== 'string' || !/^\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(decimal)
    || !Number.isFinite(Number(decimal))) throw new TypeError('A finite nonnegative decimal string is required');
  return rounded(...fraction(decimal));
}
export function calculateCapturedMolarMass(record, identity) {
  const reject = reason => freeze({schemaVersion: 1, status: 'REJECTED', reason});
  if (!positiveId(identity?.lessonRunOrdinal) || !positiveId(identity?.calculationOrdinal)) return reject('INVALID_CALCULATION_IDENTITY');
  if (record == null || record.quality === 'UNAVAILABLE') return reject('GC_UNAVAILABLE');
  if (!Object.isFrozen(record) || !Object.isFrozen(record.composition)) return reject('GC_NOT_IMMUTABLE');
  if (record.measurementType !== 'GAS_COMPOSITION' || record.source !== 'GC' || record.quality !== 'GOOD'
    || record.basis !== 'mole-percent') return reject('INVALID_GC_METADATA');
  if (!positiveId(record.analysisId) || !['A', 'B'].includes(record.profileId)
    || record.provenance?.type !== 'SAMPLED_DELAYED_EDUCATIONAL_OBSERVATION'
    || record.timeDomain !== 'GC_LOCAL_SIMULATION_STEPS'
    || ![record.sampleCapturedAt, record.analysisStartedAt, record.analysisCompletedAt, record.deliveredAt].every(tick)
    || record.sampleCapturedAt !== record.analysisStartedAt
    || record.analysisCompletedAt - record.analysisStartedAt !== 2
    || record.deliveredAt !== record.analysisCompletedAt) return reject('INVALID_GC_PROVENANCE');
  const composition = record.composition;
  if (!composition || typeof composition !== 'object' || Array.isArray(composition)
    || Reflect.ownKeys(composition).length !== 3
    || !components.every(key => Object.hasOwn(composition, key))) return reject('INVALID_COMPONENT_SLATE');
  if (!components.every(key => typeof composition[key] === 'number' && Number.isFinite(composition[key])
    && composition[key] >= 0 && composition[key] <= 100)) return reject('INVALID_COMPONENT_VALUE');
  if (components.reduce((sum, key) => sum + composition[key], 0) !== 100) return reject('INVALID_COMPOSITION_TOTAL');
  const portions = components.map(key => fraction(composition[key]));
  const common = portions.reduce((max, pair) => pair[1] > max ? pair[1] : max, 1n);
  // Also reject decimal nonclosure hidden by binary summation; never normalize.
  if (portions.reduce((sum, [n, d]) => sum + n * (common / d), 0n) !== 100n * common) return reject('INVALID_COMPOSITION_TOTAL');
  const contributions = Object.fromEntries(components.map(key => [key, composition[key] / 100 * constants[key]]));
  const value = components.reduce((sum, key) => sum + contributions[key], 0);
  const numerator = portions.reduce((sum, [n, d], i) => sum + n * (common / d) * scaledConstants[i], 0n);
  const source = {analysisId: record.analysisId, profileId: record.profileId,
    composition: Object.fromEntries(components.map(key => [key, composition[key]])), compositionBasis: 'mole-percent',
    sampleCapturedAt: record.sampleCapturedAt, analysisStartedAt: record.analysisStartedAt,
    analysisCompletedAt: record.analysisCompletedAt, deliveredAt: record.deliveredAt,
    provenance: {type: record.provenance.type}, timeDomain: record.timeDomain};
  return freeze({schemaVersion: 1, status: 'CALCULATED',
    calculationId: `run-${identity.lessonRunOrdinal}:calculation-${identity.calculationOrdinal}`,
    identityScope: 'PAGE_SESSION', property: 'MOLAR_MASS', value, unit: 'kg/kmol',
    displayValue: rounded(numerator, common * 1000000n), contributions, source,
    method: {id: 'INSTMATES_EDUCATIONAL_MOLAR_MASS', version: 1},
    constants: {id: 'INSTMATES-MOLAR-MASS-CONSTANTS', version: 1, values: {...constants},
      unit: 'kg/kmol', sourceIdentity: 'NIST Chemistry WebBook / SRD 69'},
    calculationInputIdentity: {lessonRunOrdinal: identity.lessonRunOrdinal, analysisId: record.analysisId,
      canonicalCapturedRecord: JSON.stringify(source)}, applicability: 'CAPTURED_EDUCATIONAL_COMPOSITION_ONLY'});
}
