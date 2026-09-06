# Admin scripts (local only)

Run by an administrator from a workstation with Admin SDK credentials:

```bash
cd scripts/admin && npm install
export GOOGLE_APPLICATION_CREDENTIALS=/secure/path/instmates-admin-sa.json   # service account for project instmates
node backfill-profile-status.mjs                # DRY RUN (default) – prints counts, writes nothing
node backfill-profile-status.mjs --report backfill-dryrun.json
node backfill-profile-status.mjs --apply        # ONLY after owner/CTO authorization
node backfill-profile-status.mjs                # second dry run must report WOULD_UPDATE: 0
node restore-profiles.mjs                       # DRY RUN
```

Against the local emulator (no credentials needed):

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node backfill-profile-status.mjs --project demo-instmates-web
```

Both scripts log UIDs and counts only. Neither logs email, names or profile content.

## Read-only identity reconciliation

```bash
node reconcile-identities.mjs --project instmates --report ../../../w0-reconcile.json
```

Joins Auth users, `users/{uid}` and `profiles/{uid}` by UID and prints counts only
(no names, emails, provider data or profile content). Never writes.

## Preferred credentials: Application Default Credentials (no key files)

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project instmates
```

Both scripts pick up ADC automatically. Never reuse Firebase CLI tokens; never place key files in the repository.
