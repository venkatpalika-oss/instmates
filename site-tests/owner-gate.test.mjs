// Deterministic tests for the owner merge gate (.github/workflows/owner-gate.yml).
// The inline github-script is read from the workflow file itself and executed
// against mocked GitHub API responses. No network, no dependencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const WORKFLOW = new URL('../.github/workflows/owner-gate.yml', import.meta.url);

function extractScript(yamlText) {
  const lines = yamlText.split(/\r?\n/);
  const start = lines.findIndex((l) => /^\s+script:\s*\|\s*$/.test(l));
  assert.ok(start >= 0, 'owner-gate.yml must contain a `script: |` block');
  const keyIndent = lines[start].search(/\S/);
  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() !== '' && line.search(/\S/) <= keyIndent) break;
    body.push(line);
  }
  const indent = Math.min(...body.filter((l) => l.trim()).map((l) => l.search(/\S/)));
  return body.map((l) => l.slice(indent)).join('\n');
}

const yamlText = readFileSync(WORKFLOW, 'utf8');
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const gateScript = new AsyncFunction('github', 'context', 'core', extractScript(yamlText));

const OWNER = 'venkatpalika-oss';
const PR = 64;
const HEAD = 'b'.repeat(40);
const OLD_HEAD = 'a'.repeat(40);
const LABEL = 'merge-authorized';
const T = (minute) => `2026-11-17T18:${String(minute).padStart(2, '0')}:00Z`;

const labeled = (login, type, minute, name = LABEL) =>
  ({ event: 'labeled', created_at: T(minute), label: { name }, actor: { login, type } });
const unlabeled = (login, type, minute, name = LABEL) =>
  ({ event: 'unlabeled', created_at: T(minute), label: { name }, actor: { login, type } });
const run = (minute, { sha = HEAD, prs = [PR] } = {}) =>
  ({ head_sha: sha, created_at: T(minute), pull_requests: prs.map((number) => ({ number })) });

async function gate({ action = 'labeled', labels = [LABEL], timeline = [], runs = [], fail = {} } = {}) {
  const out = { failed: null, notices: [], warnings: [], removeCalls: 0, runQueries: [] };
  const listEventsForTimeline = () => {};
  const listWorkflowRuns = () => {};
  const github = {
    paginate: async (fn, params) => {
      if (fn === listEventsForTimeline) {
        assert.equal(params.issue_number, PR);
        if (fail.timeline) throw new Error('timeline unavailable');
        return timeline;
      }
      if (fn === listWorkflowRuns) {
        out.runQueries.push(params);
        if (fail.runs) throw new Error('runs unavailable');
        return runs;
      }
      throw new Error('unexpected paginate call');
    },
    rest: {
      issues: {
        listEventsForTimeline,
        removeLabel: async () => {
          out.removeCalls += 1;
          if (fail.remove) throw new Error('remove failed');
        },
      },
      actions: { listWorkflowRuns },
    },
  };
  const context = {
    repo: { owner: OWNER, repo: 'instmates' },
    payload: { action, pull_request: { number: PR, head: { sha: HEAD }, labels: labels.map((name) => ({ name })) } },
  };
  const core = {
    info() {},
    notice: (m) => out.notices.push(m),
    warning: (m) => out.warnings.push(m),
    setFailed: (m) => { out.failed = m; },
  };
  await gateScript(github, context, core);
  return out;
}

const pass = (r) => assert.equal(r.failed, null, `expected PASS, got: ${r.failed}`);
const fails = (r, pattern) => {
  assert.notEqual(r.failed, null, 'expected FAIL, got PASS');
  if (pattern) assert.match(r.failed, pattern);
};

test('workflow grants only the read scopes the gate needs in addition to label removal', () => {
  assert.match(yamlText, /permissions:\n\s+contents: read\n\s+pull-requests: write\n\s+issues: read\n\s+actions: read\n/);
  assert.doesNotMatch(yamlText, /contents: write|pull_request_target|secrets\./);
});

test('no label: FAIL', async () => {
  fails(await gate({ action: 'opened', labels: [] }), /absent/);
});

test('owner applied after the head reached the PR: PASS', async () => {
  const r = await gate({ timeline: [labeled(OWNER, 'User', 10)], runs: [run(5), run(10)] });
  pass(r);
  assert.match(r.notices.join(' '), /applied by venkatpalika-oss/);
  assert.deepEqual(
    { workflow_id: r.runQueries[0].workflow_id, head_sha: r.runQueries[0].head_sha, event: r.runQueries[0].event },
    { workflow_id: 'owner-gate.yml', head_sha: HEAD, event: 'pull_request' },
  );
});

test('bot applied: FAIL', async () => {
  fails(await gate({ timeline: [labeled('github-actions[bot]', 'Bot', 10)], runs: [run(5)] }), /github-actions\[bot\] \(Bot\)/);
});

test('owner login with non-User type: FAIL', async () => {
  fails(await gate({ timeline: [labeled(OWNER, 'Bot', 10)], runs: [run(5)] }), /not by an owner/);
});

test('unauthorized user applied: FAIL', async () => {
  fails(await gate({ timeline: [labeled('someone-else', 'User', 10)], runs: [run(5)] }), /someone-else \(User\)/);
});

test('owner applied, then a bot removed and re-applied: FAIL', async () => {
  const timeline = [labeled(OWNER, 'User', 6), unlabeled('codex[bot]', 'Bot', 7), labeled('codex[bot]', 'Bot', 8)];
  fails(await gate({ timeline, runs: [run(5)] }), /codex\[bot\]/);
});

test('stale label: owner authorized the old head, removal failed, head changed: FAIL', async () => {
  // Owner labelled at :06 for the old head; the new head reached the PR at :08.
  // A later unrelated event (e.g. another label) re-runs the gate with the label still present.
  const timeline = [labeled(OWNER, 'User', 6), labeled('codex[bot]', 'Bot', 9, 'documentation')];
  fails(await gate({ timeline, runs: [run(8), run(9)] }), /stale/);
});

test('label applied in the same second the head arrived: FAIL (strictly after required)', async () => {
  fails(await gate({ timeline: [labeled(OWNER, 'User', 8)], runs: [run(8)] }), /stale/);
});

test('re-authorization after a head change: PASS', async () => {
  const timeline = [labeled(OWNER, 'User', 6), unlabeled('github-actions[bot]', 'Bot', 8), labeled(OWNER, 'User', 12)];
  pass(await gate({ timeline, runs: [run(8), run(12)] }));
});

test('owner label followed by an unrelated bot label: PASS', async () => {
  const timeline = [labeled(OWNER, 'User', 10), labeled('codex[bot]', 'Bot', 11, 'documentation')];
  pass(await gate({ labels: [LABEL, 'documentation'], timeline, runs: [run(5), run(11)] }));
});

test('changed head (synchronize): FAIL and the label is removed', async () => {
  const r = await gate({ action: 'synchronize', timeline: [labeled(OWNER, 'User', 6)], runs: [run(8)] });
  fails(r, /head changed/);
  assert.equal(r.removeCalls, 1);
});

test('changed head with failing label removal: still FAIL', async () => {
  const r = await gate({ action: 'synchronize', fail: { remove: true } });
  fails(r, /head changed/);
  assert.equal(r.removeCalls, 1);
  assert.match(r.warnings.join(' '), /Could not remove/);
});

test('earlier run of the same SHA on another PR or for another head is ignored', async () => {
  // Same SHA pushed elsewhere at :02 must not make the owner's :06 label (for the old head) look fresh.
  const runs = [run(2, { prs: [99] }), run(3, { sha: OLD_HEAD }), run(8)];
  fails(await gate({ timeline: [labeled(OWNER, 'User', 6)], runs }), /stale/);
});

test('timeline API failure: FAIL closed', async () => {
  fails(await gate({ timeline: [labeled(OWNER, 'User', 10)], runs: [run(5)], fail: { timeline: true } }), /failing closed/);
});

test('workflow-runs API failure: FAIL closed', async () => {
  fails(await gate({ timeline: [labeled(OWNER, 'User', 10)], runs: [run(5)], fail: { runs: true } }), /failing closed/);
});

test('label present but no labeled event in the timeline: FAIL', async () => {
  fails(await gate({ timeline: [], runs: [run(5)] }), /unknown account/);
});

test('no run evidence for this head on this PR: FAIL closed', async () => {
  fails(await gate({ timeline: [labeled(OWNER, 'User', 10)], runs: [] }), /failing closed/);
  fails(await gate({ timeline: [labeled(OWNER, 'User', 10)], runs: [run(5, { prs: [] })] }), /failing closed/);
});

test('labeled event without a timestamp: FAIL closed', async () => {
  const event = { ...labeled(OWNER, 'User', 10), created_at: undefined };
  fails(await gate({ timeline: [event], runs: [run(5)] }), /failing closed/);
});
