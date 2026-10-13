import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = '43217d4a355b4476b85d06be753993adac049de5';
const pagePath = 'public/knowledge/gc/gc-sampling-system.html';
const sitemapPath = 'public/sitemap.xml';
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const original = p => execFileSync('git', ['show', `${base}:${p}`], { cwd: root, encoding: 'utf8' });
const excluded = ['videos/', 'videos/gc/', 'videos/gc/gc-sampling-system/'];

test('R09 removes exactly the advertisement section and preserves all other page bytes', () => {
  const before = original(pagePath);
  const start = before.indexOf('<!-- ================= VIDEO EXPLAINER');
  const end = before.indexOf('<!-- ================= SVG 1 :', start);
  assert.ok(start >= 0 && end > start);
  assert.equal(read(pagePath), before.slice(0, start) + before.slice(end));
  assert.doesNotMatch(read(pagePath), /\/videos\/|Watch Sampling System Animation|Animated Working Principle/);
});

test('R12–R14 remove exactly three excluded sitemap URL elements', () => {
  let expected = original(sitemapPath);
  for (const route of excluded) {
    const block = `  <url>\n    <loc>https://www.instmates.com/${route}</loc>\n    <lastmod>2026-02-20</lastmod>\n  </url>\n`;
    assert.equal(expected.split(block).length - 1, 1);
    expected = expected.replace(block, '');
  }
  assert.equal(read(sitemapPath), expected);
  assert.doesNotMatch(read(sitemapPath), /<loc>[^<]*\/videos\//);
});

test('all other sitemap locations retain their exact order, including header hygiene issue', () => {
  const locations = s => [...s.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const before = locations(original(sitemapPath));
  const after = locations(read(sitemapPath));
  assert.equal(before.length - after.length, 3);
  assert.deepEqual(after, before.filter(u => !excluded.some(p => u === `https://www.instmates.com/${p}`)));
  assert.ok(after.includes('https://www.instmates.com/includes/header/'));
});

test('excluded video source files remain byte-identical to the reviewed base', () => {
  const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', base, 'public/videos/'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
  assert.equal(paths.length, 4);
  for (const p of paths) assert.equal(read(p), original(p), p);
});
