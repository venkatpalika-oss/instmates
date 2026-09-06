#!/usr/bin/env node
/**
 * InstMates – one-off Admin SDK backfill of `profiles/{uid}.profileStatus`
 *
 * PURPOSE
 *   Legacy profile documents (created before the nested schema, or by the
 *   old restoreProfiles function) carry no `profileStatus` map. The W0
 *   Firestore rules (strict) grant public read ONLY when
 *   profileStatus.isPublic == true, so every document must carry an explicit
 *   visibility before those rules go live.
 *
 * VISIBILITY MAPPING (owner/CTO direction, W0 data gate item 6)
 *   profileStatus already present            -> SKIP (ALREADY_MIGRATED)
 *   legacy `publicProfile === true`          -> isPublic = true  (WOULD_SET_PUBLIC)
 *   legacy `publicProfile === false`         -> isPublic = false (WOULD_SET_PRIVATE)
 *   no legacy visibility field               -> isPublic = false (AMBIGUOUS_DEFAULT_PRIVATE)
 *   legacy field present but not a boolean   -> isPublic = false (MALFORMED, defaulted private)
 *   Privacy wins. Absence never implies public. Previous directory
 *   visibility caused only by permissive rules is not evidence.
 *
 * WRITE SHAPE
 *   Exactly one field is written:  profileStatus: { isPublic: <bool> }
 *   No provenance marker is stored on member documents (owner decision,
 *   gate item 10): idempotency is determined solely by the presence of
 *   profileStatus, and provenance lives in the --report JSON.
 *
 * SAFETY
 *   - DRY RUN BY DEFAULT. Reads only unless --apply is passed.
 *   - Production writes require ALL of: --apply, --project instmates,
 *     --confirm-project instmates (typed deliberately). Any mismatch aborts
 *     before any read or write.
 *   - The Flutter development project (instmates-dev) is refused as a
 *     target unless --allow-dev is given, so this script cannot touch it by
 *     accident.
 *   - Admin SDK only: GOOGLE_APPLICATION_CREDENTIALS (service-account key
 *     kept OUTSIDE the repository) or Application Default Credentials.
 *     No CLI OAuth tokens, no HTTP surface.
 *   - Idempotent and resumable: presence of `profileStatus` is the marker.
 *   - Paginated reads (200) and bounded batched writes (<= 100 per commit).
 *   - Never overwrites an existing profileStatus; never touches any other
 *     field; legacy fields are preserved untouched.
 *   - Logs counts only; UIDs appear only on a failed batch in the console or in
 *     the report when --include-uids is passed. Never logs email, names or content.
 *   - Fails safely: the first failed batch aborts the run; a re-run resumes.
 *
 * USAGE
 *   node backfill-profile-status.mjs --project instmates                          # DRY RUN (reads only)
 *   node backfill-profile-status.mjs --project instmates --report dryrun.json
 *   node backfill-profile-status.mjs --project instmates --apply --confirm-project instmates   # WRITES
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node backfill-profile-status.mjs --project demo-x   # emulator
 */
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const ALLOW_DEV = args.includes("--allow-dev");
const PAGE = Number(argValue("--page-size", 200));
const BATCH = Math.min(Number(argValue("--batch-size", 100)), 100);
const PROJECT = argValue("--project", null);
const CONFIRM = argValue("--confirm-project", null);
const REPORT = argValue("--report", null);
const MAX_DOCS = Number(argValue("--max", 0)); // 0 = unlimited
const INCLUDE_UIDS = args.includes("--include-uids"); // report is counts + classification only unless asked

function argValue(flag, dflt) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt;
}

function abort(msg) {
  console.error("ABORT: " + msg);
  process.exit(2);
}

/* ================= TARGET GUARDS (evaluated before any Firestore access) ================= */
if (!PROJECT) abort("--project is required (no implicit default project)");
const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
if (PROJECT === "instmates-dev" && !ALLOW_DEV) abort("refusing to target the Flutter development project instmates-dev (pass --allow-dev only if you really mean it)");
if (APPLY && !usingEmulator && CONFIRM !== PROJECT) abort(`--apply against a live project requires --confirm-project ${PROJECT} (got ${CONFIRM === null ? "nothing" : JSON.stringify(CONFIRM)})`);
if (!usingEmulator && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log("note: GOOGLE_APPLICATION_CREDENTIALS not set; using Application Default Credentials if available");
}

console.log("==================================================");
console.log(`TARGET PROJECT : ${PROJECT}${usingEmulator ? "  (EMULATOR " + process.env.FIRESTORE_EMULATOR_HOST + ")" : "  (LIVE)"}`);
console.log(`MODE           : ${APPLY ? "APPLY" : "DRY RUN"}`);
console.log(`WRITES ENABLED : ${APPLY ? "YES" : "NO"}`);
console.log(`BATCH SIZE     : ${BATCH}   PAGE SIZE: ${PAGE}`);
console.log("==================================================");

function credential() {
  const p = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (p) return cert(JSON.parse(readFileSync(p, "utf8")));
  return applicationDefault();
}

const app = initializeApp(usingEmulator ? { projectId: PROJECT } : { credential: credential(), projectId: PROJECT });
const db = getFirestore(app);

const counts = {
  MODE: APPLY ? "APPLY" : "DRY_RUN",
  PROJECT,
  TARGET: usingEmulator ? `emulator ${process.env.FIRESTORE_EMULATOR_HOST}` : "live",
  TOTAL: 0,
  ALREADY_MIGRATED: 0,
  WOULD_SET_PUBLIC: 0,
  WOULD_SET_PRIVATE: 0,
  AMBIGUOUS_DEFAULT_PRIVATE: 0,
  MALFORMED: 0,
  ERRORS: 0,
  WOULD_UPDATE: 0,
  UPDATED: 0,
};
const plan = []; // { uid, classification, isPublic }

function classify(data) {
  if (data.profileStatus !== undefined) return { classification: "ALREADY_MIGRATED" };
  const legacy = data.publicProfile;
  if (legacy === true) return { classification: "WOULD_SET_PUBLIC", isPublic: true };
  if (legacy === false) return { classification: "WOULD_SET_PRIVATE", isPublic: false };
  if (legacy === undefined) return { classification: "AMBIGUOUS_DEFAULT_PRIVATE", isPublic: false };
  return { classification: "MALFORMED", isPublic: false };
}

async function scan() {
  let last = null;
  for (;;) {
    let q = db.collection("profiles").orderBy("__name__").limit(PAGE);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;
    for (const doc of snap.docs) {
      counts.TOTAL++;
      let data;
      try { data = doc.data() || {}; } catch (e) { counts.ERRORS++; console.error("read-error", doc.id); continue; }
      const c = classify(data);
      counts[c.classification]++;
      if (c.classification !== "ALREADY_MIGRATED") {
        counts.WOULD_UPDATE++;
        plan.push({ uid: doc.id, classification: c.classification, isPublic: c.isPublic });
      }
      if (MAX_DOCS && counts.TOTAL >= MAX_DOCS) return;
    }
    last = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE) break;
  }
}

async function apply() {
  for (let i = 0; i < plan.length; i += BATCH) {
    const chunk = plan.slice(i, i + BATCH);
    const batch = db.batch();
    for (const item of chunk) {
      // update() (not set/merge) so a document deleted since the scan fails
      // loudly instead of being recreated; only profileStatus is touched.
      batch.update(db.collection("profiles").doc(item.uid), { profileStatus: { isPublic: item.isPublic } });
    }
    try {
      await batch.commit();
      counts.UPDATED += chunk.length;
      console.log(`committed ${counts.UPDATED}/${plan.length}`);
    } catch (e) {
      counts.ERRORS++;
      console.error(`batch starting at index ${i} failed:`, e.message);
      throw e; // fail safely: stop, report, re-run is idempotent
    }
  }
}

(async () => {
  await scan();
  if (APPLY) {
    if (plan.length === 0) console.log("nothing to update");
    else await apply();
  }
  const report = {
    ...counts,
    ranAt: new Date().toISOString(),
    planByClassification: plan.reduce((m, p) => ((m[p.classification] = (m[p.classification] || 0) + 1), m), {}),
  };
  console.log(JSON.stringify(report, null, 2));
  if (REPORT) {
    // Permanent report = counts + classification totals only (no PII, no
    // UIDs) unless --include-uids is passed for an operational need.
    const body = INCLUDE_UIDS
      ? { ...report, uids: plan.map((p) => ({ uid: p.uid, classification: p.classification, isPublic: p.isPublic })) }
      : report;
    writeFileSync(REPORT, JSON.stringify(body, null, 2));
    console.log("report written:", REPORT, INCLUDE_UIDS ? "(includes UIDs)" : "(counts only)");
  }
  process.exit(counts.ERRORS ? 1 : 0);
})().catch((e) => {
  console.error("FATAL", e.message);
  console.log(JSON.stringify(counts, null, 2));
  process.exit(1);
});
