# Main branch merge protection

**Why:** PR #40 and PR #41 were merged into `main` seconds after creation, before the authorized review gate. The repository, not browser discipline, must enforce the gate.

## Required flow

feature branch → PR → `build_and_preview` succeeds → owner/CTO explicitly authorizes the exact head → `merge-authorized` label applied → `owner-gate` succeeds → merge button available → merge (merge commit) → production deploy.

## Phase A — owner-gate workflow (this change)

`.github/workflows/owner-gate.yml` reports a check named **`owner-gate`** on every PR to `main` (events: opened, reopened, synchronize, labeled, unlabeled).

| State | Result |
|---|---|
| No `merge-authorized` label | FAIL |
| `merge-authorized` present, last applied by a listed owner/CTO user **after** the current head reached the PR | PASS |
| `merge-authorized` present, last applied by any other account, bot or app | FAIL |
| `merge-authorized` present, but applied before the current head reached the PR (stale, e.g. removal failed) | FAIL |
| Timeline or workflow-run API error, or missing evidence | FAIL (fail closed) |
| Head changes (synchronize) | label removed by the workflow (best effort), FAIL until re-authorized |

Authorization is therefore per head SHA. Permissions: `contents: read`, `pull-requests: write` (label removal only), `issues: read` (PR timeline), `actions: read` (this workflow's runs); `GITHUB_TOKEN` only, no PAT, no bypass token.

### Label-actor and head-binding checks

The label alone is not proof of authorization: any token or GitHub App with issue or pull-request write access (including CI tokens and AI agents) can apply it, and a failed label removal after a head change would leave an old authorization in place. The gate therefore requires:

1. **Actor:** the **most recent** `labeled` event for `merge-authorized` (PR timeline) was made by a `User` account in the workflow's `AUTHORIZERS` list (currently `venkatpalika-oss`).
2. **Head binding:** that event's server timestamp is strictly later than the moment the current head SHA reached this PR. That moment is the `created_at` of the earliest `owner-gate` run for this PR (`pull_requests` contains the PR number) with this exact `head_sha`. The gate runs on `opened`, `reopened` and `synchronize`, so every head that reaches the PR has such a run. Timeline `committed` events carry no server timestamp (only forgeable author/committer dates) and are not used.
3. **Fail closed:** any API error, a missing `labeled` event, a missing timestamp or no matching run means FAIL.

Changing `AUTHORIZERS` is a change to `main` and passes through this gate. Deterministic tests: `site-tests/owner-gate.test.mjs` runs the workflow's inline script against mocked GitHub responses (owner, bot, unauthorized user, stale label, re-authorization, changed head, failed removal, API failures, missing evidence).

### Known limitations and remaining risks

- **A PR can change its own gate.** For `pull_request` events, GitHub runs the workflow file from the PR's merge commit, so a PR that edits `owner-gate.yml` is judged by the edited version. The gate cannot defend against this by itself. Mitigations, none active yet: owner review of every diff under `.github/`; a ruleset or CODEOWNERS rule for `.github/**` (only effective together with a required review); keeping agent tokens away from `.github/` (see the Academy agent proposal).
- **Same-SHA return:** if a head goes A → B → A, the earliest run for A predates B, so a label applied for A before B (and never removed) is accepted again for A. It is the identical code the owner authorized.
- **Fork PRs:** `pull_requests` on workflow runs may be empty for PRs from forks, so the gate FAILS for them (fail closed). This repository does not use fork PRs.
- **Log retention:** if this head's `owner-gate` runs are deleted, the gate FAILS until the owner re-applies the label after a new run exists (close/reopen the PR to trigger one).
- **Timing:** a label applied before GitHub records the run for a new head is treated as stale. Re-apply the label after the new head's check has appeared.
- **`AUTHORIZERS` is a static list.** Account renames or additional CTO accounts require a reviewed change.
- **Live positive path:** the actor and head-binding checks PASS only in the deterministic tests until the owner applies the label on a live PR.

## Phase B — branch protection (separate authorization; not active yet)

Main: require a pull request; required status checks `build_and_preview` and `owner-gate`; no approving-review requirement; no branch-up-to-date requirement; block force pushes; block deletion; **"Do not allow bypassing the above settings" ON**. Repository merge methods: merge commit only; squash, rebase and auto-merge disabled.

## Operational contract for the label

`merge-authorized` is a privileged control signal. It is applied only when an owner/CTO instruction explicitly authorizes merging the current PR head; before applying it, verify PR number, repository, base, full head SHA and the authorization text. Completed implementation, green tests, a green preview, an open PR or a recommendation to merge never justify the label. PR creation authorization never implies merge authorization. If the head changes afterwards, the authorization has expired.

## Emergency path

If the gate blocks legitimate emergency work: the owner temporarily unchecks "Do not allow bypassing the above settings" (or removes `owner-gate` from the required checks), merges, and restores the rule; every exception is recorded in the external evidence manifest with PR, reason and restoration time.
