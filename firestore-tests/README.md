# Firestore + Storage Security Rules tests (website)

Executable tests for `../firestore.rules` and `../storage.rules`, run against the
Firebase Local Emulator Suite only. `firebase emulators:exec` starts throwaway
emulators under the `demo-instmates-web` project id (Firebase's convention for
emulator-only projects), runs the tests, then shuts down. Nothing here can reach
the production `instmates` project.

## Prerequisites

- Node 20+ and the Firebase CLI (`firebase --version` ≥ 13)
- JDK 21+ for the Firestore emulator. On this machine: `C:\devtools\jdk21`
  (the Flutter app pins JDK 17 separately; do not change that).

```bash
export PATH="/c/devtools/jdk21/bin:$PATH"
export JAVA_HOME="C:/devtools/jdk21"
cd firestore-tests && npm install
```

## Run (from the repository root)

```bash
firebase emulators:exec --only firestore,storage --project demo-instmates-web "npm --prefix firestore-tests test"
```

## Variants

Default run tests `../firestore.rules` (STRICT). `RULES_FILE=../firestore.legacy-compat.rules npm test` runs the rollback-only variant; `RULES_FILE=<saved deployed rules> node --test client-ops.test.mjs` proves the W0 client against the pre-W0 production rules.

## Coverage

`rules.test.mjs` – users (owner-only read, registration shape, privileged fields
locked), profiles (rules-layer privacy for get and list, legacy documents,
owner allow-list, self-verification denied, storage-only photo URLs, size and
type limits), posts/comments (validation, one reaction per member, no delete),
and default-deny for collections without rules.

`storage.test.mjs` – `profilePhotos/{uid}` and `postAttachments/{uid}/{file}`
ownership, content-type and size limits, immutability, default-deny elsewhere.
