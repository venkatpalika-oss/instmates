import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const base = '43217d4a355b4476b85d06be753993adac049de5';
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const original = p => git('show', base + ':' + p);
const prefix = 'public/knowledge/field/signals/4-20ma/';
const destination = '/knowledge/field/signals/4-20ma/loop-resistance.html';
const removed = `    <a class="btn btn-primary"
       href="/knowledge/field/signals/4-20ma/loop-resistance.html">
      Next: Loop Resistance →
    </a>
`;
const ledger = [
  { id: 'R05', path: prefix + 'scaling-calculation.html', back: 'troubleshooting.html', label: '← Back to Troubleshooting', hash: 'deb8c8424a22aa2e4e819c68d0103db3f265c3b8dde0e7891d243f60169ed6c5' },
  { id: 'R06', path: prefix + 'troubleshooting.html', back: 'wiring-types.html', label: '← Back to Wiring Types', hash: '668ba6277b550ed7b9ac5af92336f7a709cb641138d9a4a80f293737bcfa3747' }
];
const links = s => [...s.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
test('exact R05/R06 ledger; advertised destination has no tracked article', () => {
  assert.deepEqual(ledger.map(e => e.id), ['R05', 'R06']);
  assert.equal(git('ls-files', '--', prefix + 'loop-resistance.html', prefix + 'loop-resistance/index.html'), '');
});
for (const entry of ledger) {
  test(`${entry.id}: only accepted anchor bytes removed; educational text unchanged`, () => {
    const before = original(entry.path), after = read(entry.path);
    assert.equal(createHash('sha256').update(before).digest('hex'), entry.hash);
    assert.equal(before.split(removed).length, 2);
    assert.equal(after, before.replace(removed, ''));
    assert.ok(!after.includes(destination));
    assert.ok(!after.includes('Next: Loop Resistance'));
  });
  test(`${entry.id}: back navigation retained; row nonempty with no orphan separator`, () => {
    const row = read(entry.path).match(/<div class="action-row">([\s\S]*?)<\/div>/)[1];
    const anchor = `    <a class="btn btn-ghost"\n       href="/knowledge/field/signals/4-20ma/${entry.back}">\n      ${entry.label}\n    </a>`;
    assert.equal(row.trim(), anchor.trim());
    assert.ok(original(entry.path).includes(anchor));
  });
  test(`${entry.id}: unrelated links unchanged; no new destinations or excluded exposure`, () => {
    const before = links(original(entry.path)), after = links(read(entry.path));
    assert.deepEqual(after, before.filter(u => u !== destination));
    assert.ok(!after.some(u => /^\/(?:videos(?:[/.]|$)|simulations\/gas-metering-skid)/.test(u)));
  });
}
test('all protected tracked bytes/modes, including Desalter and remaining callers, unchanged', () => {
  const allowed = new Set(ledger.map(e => e.path));
  const entries = git('ls-tree', '-rz', base).split('\0').filter(Boolean);
  let protectedCount = 0;
  for (const line of entries) {
    const [meta, p] = line.split('\t');
    if (allowed.has(p)) continue;
    const [mode, , oid] = meta.split(' ');
    assert.equal(git('hash-object', p).trim(), oid, p);
    assert.equal(git('ls-files', '-s', '--', p).split(' ')[0], mode, p);
    if (process.platform !== 'win32') assert.equal(Boolean(statSync(new URL('../' + p, import.meta.url)).mode & 0o111), mode === '100755', p);
    protectedCount++;
  }
  assert.equal(protectedCount, 274);
});
test('exact HTML route inventory unchanged', () => {
  const walk = p => readdirSync(new URL('../' + p, import.meta.url), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(p + '/' + e.name) : [p + '/' + e.name]);
  const expected = git('ls-tree', '-r', '--name-only', base, '--', 'public').trim().split('\n').filter(p => p.endsWith('.html')).sort();
  assert.deepEqual(walk('public').filter(p => p.endsWith('.html')).sort(), expected);
});
test('preservation commits retain identity and remain outside this checkout ancestry', () => {
  const identities = [
    ['8e2e5630cf638952ca42e14cabd3ec9886e805a1', '0ee0f1db926a4a6c12db6b1e81c75de3dceefa28'],
    ['b675d60594e4625fb45e1e3a3517f03095e1ccf3', 'e40477e537bfff3490f9617b6a93413b41c03766'],
    ['eff90270e7a234fa3c767798ddee2cde466445b7', 'f08d7abdf0828ad7fd8bde64abfc8b9100795928']
  ];
  for (const [commit, tree] of identities) {
    assert.equal(git('rev-parse', commit + '^{tree}').trim(), tree);
    assert.equal(git('rev-parse', commit + '^').trim(), base);
    assert.notEqual(git('merge-base', 'HEAD', commit).trim(), commit);
  }
  for (const p of ['public/includes/header.html', 'public/knowledge/laboratory/index.html', 'public/legal.html']) assert.equal(read(p), original(p));
});
