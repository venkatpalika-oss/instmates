# Main branch merge protection

**Why:** PR #40 and PR #41 were merged into `main` seconds after creation, before the authorized review gate. The repository, not browser discipline, must enforce the gate.

## Required flow

feature branch → PR → `build_and_preview` succeeds → owner/CTO explicitly authorizes the exact head → `merge-authorized` label applied → `owner-gate` succeeds → merge button available → merge (merge commit) → production deploy.

## Phase A — owner-gate workflow (this change)

`.github/workflows/owner-gate.yml` reports a check named **`owner-gate`** on every PR to `main` (events: opened, reopened, synchronize, labeled, unlabeled).

| State | Result |
|---|---|
| No `merge-authorized` label | FAIL |
| `merge-authorized` present, last applied by a listed owner/CTO user | PASS |
| `merge-authorized` present, last applied by any other account, bot or app | FAIL |
| Head changes (synchronize) | label removed by the workflow, FAIL until re-authorized |

Authorization is therefore per head SHA. Permissions: `contents: read`, `pull-requests: write` (label removal only), `issues: read` (PR timeline); `GITHUB_TOKEN` only, no PAT, no bypass token.

### Label-actor check

The label alone is not proof of authorization: any token or GitHub App with issue or pull-request write access (including CI tokens and AI agents) can apply it. The gate reads the PR timeline and accepts the label only if its **most recent** `labeled` event was made by a `User` account in the workflow's `AUTHORIZERS` list (currently `venkatpalika-oss`). Changing that list is a change to `main` and passes through this gate.

## Phase B — branch protection (separate authorization; not active yet)

Main: require a pull request; required status checks `build_and_preview` and `owner-gate`; no approving-review requirement; no branch-up-to-date requirement; block force pushes; block deletion; **"Do not allow bypassing the above settings" ON**. Repository merge methods: merge commit only; squash, rebase and auto-merge disabled.

## Operational contract for the label

`merge-authorized` is a privileged control signal. It is applied only when an owner/CTO instruction explicitly authorizes merging the current PR head; before applying it, verify PR number, repository, base, full head SHA and the authorization text. Completed implementation, green tests, a green preview, an open PR or a recommendation to merge never justify the label. PR creation authorization never implies merge authorization. If the head changes afterwards, the authorization has expired.

## Emergency path

If the gate blocks legitimate emergency work: the owner temporarily unchecks "Do not allow bypassing the above settings" (or removes `owner-gate` from the required checks), merges, and restores the rule; every exception is recorded in the external evidence manifest with PR, reason and restoration time.
