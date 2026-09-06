# Admin scripts (local only)

Administrator-run Firebase Admin SDK scripts for the InstMates website's
production Firebase project (`instmates`). They are never deployed and expose
no HTTP surface. Every script:

- requires an explicit `--project <id>` (there is no implicit default project);
- refuses the Flutter development project `instmates-dev` unless `--allow-dev`
  is passed;
- prints counts (and, where noted, UIDs) only - never emails, names or profile
  content.

The two scripts that can write are **dry-run by default**. A live write
requires **all** of `--apply`, `--project instmates` and
`--confirm-project instmates`; any mismatch aborts before the first read.
Production writes are performed only with explicit owner/CTO authorization.

## Credentials: Application Default Credentials only

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project instmates
```

Every script picks up ADC automatically. `GOOGLE_APPLICATION_CREDENTIALS` is
honoured if set, but service-account key files are not created for this
project and must never be placed in the repository. Never reuse Firebase CLI
OAuth or refresh tokens in scripts.

## Setup

```bash
cd scripts/admin && npm install
```

## Scripts

### `backfill-profile-status.mjs` - one-off, already applied

Adds `profileStatus: { isPublic: <bool> }` to legacy `profiles/{uid}` documents
that lack it (absence never implies public). Writes exactly that one field and
no provenance marker. Applied to production on 2026-09-06; a re-run is safe and
must report `WOULD_UPDATE: 0`.

```bash
node backfill-profile-status.mjs --project instmates                                   # dry run (reads only)
node backfill-profile-status.mjs --project instmates --report backfill-dryrun.json     # dry run + counts report
node backfill-profile-status.mjs --project instmates --apply --confirm-project instmates   # WRITES - owner authorization only
```

Optional flags: `--page-size N` (default 200), `--batch-size N` (max 100),
`--max N` (0 = unlimited), `--include-uids` (adds UIDs to the report).

### `restore-profiles.mjs` - exceptional recovery only

Local replacement for the deleted `restoreProfiles` Cloud Function (decision
D-2026-09-06-01 in the InstMates app repository). For every Auth user without a
`profiles/{uid}` document it creates one in the current schema, **private by
default**; existing documents are never touched (`create()` semantics).

```bash
node restore-profiles.mjs --project instmates                                          # dry run: counts + missing UIDs
node restore-profiles.mjs --project instmates --apply --confirm-project instmates      # WRITES - owner authorization only
```

### `reconcile-identities.mjs` - read-only

Joins Auth users, `users/{uid}` and `profiles/{uid}` by UID and prints counts
only. Never writes.

```bash
node reconcile-identities.mjs --project instmates --report reconcile.json
```

### `integrity-snapshot.mjs` - read-only

Hashes every document in `users`, `profiles`, `posts` and all `comments`, plus
Auth accounts, into a JSON file (ids and hashes only), and compares two such
files. Never writes.

```bash
node integrity-snapshot.mjs snapshot --project instmates --out before.json
node integrity-snapshot.mjs compare before.json after.json
```

## Against the local emulator (no credentials needed)

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node backfill-profile-status.mjs --project demo-instmates-web
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node restore-profiles.mjs --project demo-instmates-web
```

With the emulator host set, `--confirm-project` is not required for `--apply`.

Keep reports outside the repository; they are evidence, not source.
