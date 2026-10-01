/** No DERIVED device rule is approved for execution in M1. */
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function finiteValues(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError('Nonfinite fixture value.');
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') throw new TypeError('Invalid fixture value.');
  if (value && typeof value === 'object') for (const v of Object.values(value)) finiteValues(v);
}

export function validateDatum(datum, evidence) {
  if (!datum || !['SUPPORTED', 'DERIVED', 'UNSUPPORTED'].includes(datum.status)) throw new TypeError('Invalid evidence status.');
  const ref = evidence?.[datum.source?.evidenceId];
  if (!ref || typeof ref.section !== 'string' || !ref.section || !Array.isArray(ref.pages) || !ref.pages.length ||
      !ref.pages.every(p => Number.isInteger(p) && p >= 1 && p <= 186)) throw new TypeError('Missing or invalid source provenance.');
  if (datum.status === 'SUPPORTED') {
    if (!Object.hasOwn(datum, 'value') || datum.value === null || typeof datum.unit !== 'string' || !datum.unit || datum.availability === 'BLOCKED') throw new TypeError('Supported datum requires a value and unit.');
    finiteValues(datum.value);
  } else {
    if (Object.hasOwn(datum, 'value') || datum.availability !== 'BLOCKED' || !datum.reason || !datum.gapId) throw new TypeError('Unapproved datum must be blocked without an executable value.');
  }
  return datum;
}

export function validateFixtureTree(tree, evidence) {
  const counts = { SUPPORTED: 0, DERIVED: 0, UNSUPPORTED: 0 };
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Object.hasOwn(node, 'status')) {
      validateDatum(node, evidence);
      counts[node.status]++;
      return;
    }
    for (const value of Object.values(node)) walk(value);
  }
  walk(tree);
  return counts;
}

/** Only explicit source facts may be consumed as device truth. */
export function readSupported(datum, evidence) {
  validateDatum(datum, evidence);
  if (datum.status !== 'SUPPORTED') throw new RangeError(`Blocked technical datum: ${datum.gapId}`);
  return datum.value;
}
