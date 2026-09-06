#!/usr/bin/env node
/**
 * InstMates – READ-ONLY identity reconciliation (W0 dry-run gate, item 6/7).
 *
 * Joins Firebase Auth users, `users/{uid}` documents and `profiles/{uid}`
 * documents by UID and prints COUNTS ONLY. It never prints names, emails,
 * phone numbers, provider data or profile content, and never writes.
 *
 * Also evaluates the "restoreProfiles placeholder" hypothesis for legacy
 * profiles (no profileStatus): the old Cloud Function wrote exactly
 *   { fullName, role: "Technician", bio: "", skills: [], createdAt }
 * for every Auth user lacking a profile, on/after 2026-02-16, using
 * displayName or the email local-part as fullName.
 *
 * SAFETY
 *   - No write API is imported or called.
 *   - --project mandatory; instmates-dev refused unless --allow-dev.
 *   - Credentials: Application Default Credentials (gcloud) or
 *     GOOGLE_APPLICATION_CREDENTIALS. No CLI token reuse.
 *
 * USAGE
 *   node reconcile-identities.mjs --project instmates [--report out.json]
 */
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const argValue = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d; };
const PROJECT = argValue("--project", null);
const REPORT = argValue("--report", null);
const abort = (m) => { console.error("ABORT: " + m); process.exit(2); };
if (!PROJECT) abort("--project is required");
if (PROJECT === "instmates-dev" && !args.includes("--allow-dev")) abort("refusing to target instmates-dev");

const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
console.log("==================================================");
console.log(`TARGET PROJECT : ${PROJECT}${usingEmulator ? "  (EMULATOR)" : "  (LIVE)"}`);
console.log("MODE           : READ-ONLY RECONCILIATION");
console.log("WRITES ENABLED : NO");
console.log("==================================================");

const credential = () => process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? cert(JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8")))
  : applicationDefault();
const app = initializeApp(usingEmulator ? { projectId: PROJECT } : { credential: credential(), projectId: PROJECT });
const auth = getAuth(app);
const db = getFirestore(app);

const RESTORE_DEPLOY_DATE = "2026-02-16";

(async () => {
  // ---- Auth users (UID + metadata only; nothing personal retained) ----
  const authUsers = new Map(); // uid -> { created, hasDisplayName }
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const u of page.users) authUsers.set(u.uid, { created: u.metadata.creationTime, hasDisplayName: !!u.displayName });
    pageToken = page.pageToken;
  } while (pageToken);

  // ---- users documents (ids only) ----
  const userDocs = new Set((await db.collection("users").select().get()).docs.map((d) => d.id));

  // ---- profiles (visibility and shape fields only) ----
  const profSnap = await db.collection("profiles").select("profileStatus", "publicProfile", "role", "skills", "bio", "basicInfo", "professional", "createdAt").get();

  const c = {
    AUTH_USERS: authUsers.size, USER_DOCUMENTS: userDocs.size, PROFILES: profSnap.size,
    AUTH_WITH_PROFILE: 0, AUTH_WITHOUT_PROFILE: 0,
    PROFILES_MATCHING_AUTH: 0, PROFILES_WITHOUT_AUTH: 0,
    USERS_MATCHING_AUTH: 0, USERS_WITHOUT_AUTH: 0,
    PROFILES_WITH_USER_DOCUMENT: 0, PROFILES_WITHOUT_USER_DOCUMENT: 0,
    LEGACY_PROFILES: 0, PLACEHOLDER_SIGNATURE: 0,
    PLACEHOLDER_WITH_AUTH: 0, PLACEHOLDER_WITHOUT_AUTH: 0,
    PLACEHOLDER_WITH_USER_DOCUMENT: 0, PLACEHOLDER_WITHOUT_USER_DOCUMENT: 0,
    PLACEHOLDER_CREATED_ON_OR_AFTER_RESTORE_DEPLOY: 0, PLACEHOLDER_CREATED_BEFORE_RESTORE_DEPLOY: 0,
    PLACEHOLDER_AUTH_ACCOUNT_OLDER_THAN_PROFILE: 0,
    LEGACY_NON_PLACEHOLDER: 0,
  };
  const profileIds = new Set();
  for (const d of profSnap.docs) {
    profileIds.add(d.id);
    const f = d.data();
    if (authUsers.has(d.id)) c.PROFILES_MATCHING_AUTH++; else c.PROFILES_WITHOUT_AUTH++;
    if (userDocs.has(d.id)) c.PROFILES_WITH_USER_DOCUMENT++; else c.PROFILES_WITHOUT_USER_DOCUMENT++;
    if (f.profileStatus !== undefined) continue;
    c.LEGACY_PROFILES++;
    const isPlaceholder = f.role === "Technician" && Array.isArray(f.skills) && f.skills.length === 0 && f.bio === ""
      && f.basicInfo === undefined && f.professional === undefined && f.publicProfile === undefined;
    if (!isPlaceholder) { c.LEGACY_NON_PLACEHOLDER++; continue; }
    c.PLACEHOLDER_SIGNATURE++;
    const a = authUsers.get(d.id);
    if (a) c.PLACEHOLDER_WITH_AUTH++; else c.PLACEHOLDER_WITHOUT_AUTH++;
    if (userDocs.has(d.id)) c.PLACEHOLDER_WITH_USER_DOCUMENT++; else c.PLACEHOLDER_WITHOUT_USER_DOCUMENT++;
    const created = f.createdAt && f.createdAt.toDate ? f.createdAt.toDate() : null;
    if (created) {
      if (created.toISOString().slice(0, 10) >= RESTORE_DEPLOY_DATE) c.PLACEHOLDER_CREATED_ON_OR_AFTER_RESTORE_DEPLOY++; else c.PLACEHOLDER_CREATED_BEFORE_RESTORE_DEPLOY++;
      if (a && new Date(a.created) < created) c.PLACEHOLDER_AUTH_ACCOUNT_OLDER_THAN_PROFILE++;
    }
  }
  for (const uid of authUsers.keys()) { if (profileIds.has(uid)) c.AUTH_WITH_PROFILE++; else c.AUTH_WITHOUT_PROFILE++; }
  for (const uid of userDocs) { if (authUsers.has(uid)) c.USERS_MATCHING_AUTH++; else c.USERS_WITHOUT_AUTH++; }

  const hyp = c.PLACEHOLDER_SIGNATURE === 0 ? "NOT APPLICABLE"
    : (c.PLACEHOLDER_WITHOUT_AUTH === 0 && c.PLACEHOLDER_CREATED_BEFORE_RESTORE_DEPLOY === 0 && c.PLACEHOLDER_AUTH_ACCOUNT_OLDER_THAN_PROFILE === c.PLACEHOLDER_SIGNATURE) ? "CONFIRMED"
    : (c.PLACEHOLDER_WITHOUT_AUTH === 0 && c.PLACEHOLDER_CREATED_BEFORE_RESTORE_DEPLOY === 0) ? "STRONGLY SUPPORTED" : "NOT CONFIRMED";
  const out = { ...c, RESTOREPROFILES_HYPOTHESIS: hyp, ranAt: new Date().toISOString(), project: PROJECT };
  console.log(JSON.stringify(out, null, 2));
  if (REPORT) { writeFileSync(REPORT, JSON.stringify(out, null, 2)); console.log("report written:", REPORT); }
  process.exit(0);
})().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
