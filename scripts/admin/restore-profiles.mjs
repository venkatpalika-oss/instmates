#!/usr/bin/env node
/**
 * InstMates – local Admin SDK replacement for the deleted `restoreProfiles`
 * Cloud Function (W0 gate item 9).
 *
 * The deployed function was reachable by anyone on the internet
 * (Cloud Run invoker: allUsers), listed every Auth user and wrote
 * `profiles/{uid}` documents. This script keeps that recovery capability
 * as an administrator-run, dry-run-by-default tool with no public endpoint.
 *
 * WHAT IT DOES
 *   For every Firebase Auth user without a `profiles/{uid}` document,
 *   create one in the CURRENT nested schema, defaulting to PRIVATE so a
 *   restored profile is never published without the member's action.
 *   No provenance marker is written to member documents (gate item 10).
 *
 * SAFETY
 *   - DRY RUN BY DEFAULT; writes require --apply AND --confirm-project <id>.
 *   - instmates-dev is refused unless --allow-dev is given.
 *   - Admin SDK only; credentials via GOOGLE_APPLICATION_CREDENTIALS or ADC.
 *   - Idempotent: existing profile documents are never touched (create()).
 *   - Paginated over Auth users (1000 per page); batches of <= 100.
 *   - Logs UIDs and counts only; never logs email or display names.
 *
 * USAGE
 *   node restore-profiles.mjs --project instmates                                   # dry run
 *   node restore-profiles.mjs --project instmates --apply --confirm-project instmates
 */
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const ALLOW_DEV = args.includes("--allow-dev");
const PROJECT = argValue("--project", null);
const CONFIRM = argValue("--confirm-project", null);
function argValue(flag, dflt) { const i = args.indexOf(flag); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt; }
function abort(msg) { console.error("ABORT: " + msg); process.exit(2); }

const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
if (!PROJECT) abort("--project is required");
if (PROJECT === "instmates-dev" && !ALLOW_DEV) abort("refusing to target instmates-dev without --allow-dev");
if (APPLY && !usingEmulator && CONFIRM !== PROJECT) abort(`--apply requires --confirm-project ${PROJECT}`);

console.log("==================================================");
console.log(`TARGET PROJECT : ${PROJECT}${usingEmulator ? "  (EMULATOR)" : "  (LIVE)"}`);
console.log(`MODE           : ${APPLY ? "APPLY" : "DRY RUN"}`);
console.log(`WRITES ENABLED : ${APPLY ? "YES" : "NO"}`);
console.log("==================================================");

function credential() {
  const p = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (p) return cert(JSON.parse(readFileSync(p, "utf8")));
  return applicationDefault();
}

const app = initializeApp(usingEmulator ? { projectId: PROJECT } : { credential: credential(), projectId: PROJECT });
const auth = getAuth(app);
const db = getFirestore(app);

const counts = { MODE: APPLY ? "APPLY" : "DRY_RUN", PROJECT, AUTH_USERS: 0, HAS_PROFILE: 0, MISSING_PROFILE: 0, CREATED: 0, ERRORS: 0 };
const missing = [];

(async () => {
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const user of page.users) {
      counts.AUTH_USERS++;
      const snap = await db.collection("profiles").doc(user.uid).get();
      if (snap.exists) counts.HAS_PROFILE++;
      else { counts.MISSING_PROFILE++; missing.push({ uid: user.uid, name: user.displayName || "" }); }
    }
    pageToken = page.pageToken;
  } while (pageToken);

  if (APPLY) {
    for (let i = 0; i < missing.length; i += 100) {
      const batch = db.batch();
      for (const m of missing.slice(i, i + 100)) {
        // create() fails if the document appeared meanwhile: never overwrite.
        batch.create(db.collection("profiles").doc(m.uid), {
          basicInfo: { fullName: (m.name || "Technician").slice(0, 100), headline: "Technician", location: "" },
          professional: { specialization: "", analyzersWorked: [] },
          achievement: {},
          profileStatus: { isPublic: false },
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      try { await batch.commit(); counts.CREATED += Math.min(100, missing.length - i); }
      catch (e) { counts.ERRORS++; console.error("batch failed:", e.message); throw e; }
    }
  }
  console.log(JSON.stringify({ ...counts, missingUids: missing.map((m) => m.uid) }, null, 2));
  process.exit(counts.ERRORS ? 1 : 0);
})().catch((e) => { console.error("FATAL", e.message); console.log(JSON.stringify(counts)); process.exit(1); });
