# InstMates website

Source of [www.instmates.com](https://www.instmates.com), the InstMates
professional community for instrumentation and process-analyzer engineers.
Static HTML with vanilla ES modules and the Firebase JS SDK, hosted on Firebase
Hosting (Firebase project `instmates`).

## Repository layout

| Path | Contents |
|---|---|
| `public/` | Firebase Hosting root: every deployed page and asset |
| `firebase.json` | Hosting, Firestore, Storage and emulator configuration |
| `firestore.rules`, `storage.rules` | Production security rules (`firestore.legacy-compat.rules` is a rollback-only variant) |
| `firestore-tests/` | Emulator test suites for the rules and client operations |
| `scripts/admin/` | Local, administrator-run Admin SDK tooling (see its README) |
| `.github/workflows/` | Hosting deployment workflows |

## Deployment

Changes reach production only through a pull request to `main`:

1. Open a PR. The preview workflow deploys a temporary Hosting preview channel.
2. Verify the preview.
3. Merge. The merge workflow deploys Hosting `live`.

Both workflows deploy Hosting only. Security rules are deployed deliberately
with the Firebase CLI, never by CI. Do not bypass the pull-request requirement
on `main`.

Local rules tests (JDK 21 required):

```bash
firebase emulators:exec --only firestore,storage --project demo-instmates-web "npm --prefix firestore-tests test"
```

## Operations and security notes

- Production intentionally has **zero Firebase Cloud Functions**. Do not add or
  redeploy a function without a new security design and explicit owner
  authorization. Authoritative decision: **D-2026-09-06-01** in the InstMates
  app repository's decisions log (commit `82a9ee4`).
- Administrative and recovery tasks use the local Admin SDK scripts in
  `scripts/admin/`. They are dry-run by default; a production write requires
  `--apply` together with `--project instmates --confirm-project instmates`,
  and only with owner authorization.
- Profiles are private unless `profileStatus.isPublic` is `true`; the rules are
  the enforcement point, and the emulator suite must stay green.

## Related

The InstMates Android app lives in a separate repository and uses a separate
Firebase project (`instmates-dev`) with its own data model. The two are not
merged.
