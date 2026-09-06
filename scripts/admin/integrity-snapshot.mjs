#!/usr/bin/env node
/**
 * InstMates – READ-ONLY integrity snapshot / comparison (W0 backfill item 7).
 *
 * snapshot: hashes every document in users, profiles, posts and all
 *           comments (collection group), plus Auth accounts (uid, creation
 *           time, disabled flag), and writes counts + SHA-256 hashes to a
 *           JSON file. Profiles get two hashes: full document, and the
 *           document with `profileStatus` removed ("rest").
 * compare:  diffs two snapshot files and reports, per collection, how many
 *           documents were created, deleted, changed, and for profiles how
 *           many changed ONLY in profileStatus vs. anywhere else, and how
 *           many pre-existing profileStatus values were altered.
 *
 * Prints counts only. Hash files contain document ids and hashes, never
 * document contents. Never writes to Firestore.
 *
 * USAGE
 *   node integrity-snapshot.mjs snapshot --project instmates --out before.json
 *   node integrity-snapshot.mjs compare before.json after.json
 */
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const args = process.argv.slice(2);
const cmd = args[0];
const argValue = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d; };

function canonical(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (typeof v.toDate === "function") return JSON.stringify({ $ts: v.toDate().toISOString() });
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canonical(v[k])).join(",") + "}";
}
const sha = (s) => createHash("sha256").update(s).digest("hex");

async function snapshot() {
  const PROJECT = argValue("--project", null); const OUT = argValue("--out", null);
  if (!PROJECT || !OUT) { console.error("need --project and --out"); process.exit(2); }
  if (PROJECT === "instmates-dev") { console.error("refusing instmates-dev"); process.exit(2); }
  const usingEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
  const credential = () => process.env.GOOGLE_APPLICATION_CREDENTIALS ? cert(JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"))) : applicationDefault();
  const app = initializeApp(usingEmulator ? { projectId: PROJECT } : { credential: credential(), projectId: PROJECT });
  const db = getFirestore(app); const auth = getAuth(app);
  const snap = { project: PROJECT, takenAt: new Date().toISOString(), collections: {} };
  for (const col of ["users", "profiles", "posts"]) {
    const s = await db.collection(col).get(); const docs = {};
    for (const d of s.docs) {
      const data = d.data();
      const entry = { full: sha(canonical(data)) };
      if (col === "profiles") { const { profileStatus, ...rest } = data; entry.rest = sha(canonical(rest)); entry.hasStatus = profileStatus !== undefined; entry.statusHash = profileStatus === undefined ? null : sha(canonical(profileStatus)); }
      docs[d.id] = entry;
    }
    snap.collections[col] = { count: s.size, docs };
  }
  const cg = await db.collectionGroup("comments").get(); const cdocs = {};
  for (const d of cg.docs) cdocs[d.ref.path] = { full: sha(canonical(d.data())) };
  snap.collections.comments = { count: cg.size, docs: cdocs };
  const au = {}; let pageToken;
  do { const p = await auth.listUsers(1000, pageToken); for (const u of p.users) au[u.uid] = { full: sha(canonical({ c: u.metadata.creationTime, d: u.disabled, e: !!u.email, n: !!u.displayName })) }; pageToken = p.pageToken; } while (pageToken);
  snap.collections.auth = { count: Object.keys(au).length, docs: au };
  writeFileSync(OUT, JSON.stringify(snap, null, 1));
  console.log(JSON.stringify(Object.fromEntries(Object.entries(snap.collections).map(([k, v]) => [k, v.count]))));
  process.exit(0);
}

function compare() {
  const a = JSON.parse(readFileSync(args[1], "utf8")); const b = JSON.parse(readFileSync(args[2], "utf8"));
  const out = {};
  for (const col of Object.keys(a.collections)) {
    const A = a.collections[col].docs, B = (b.collections[col] || { docs: {} }).docs;
    const r = { before: a.collections[col].count, after: (b.collections[col] || { count: 0 }).count, created: 0, deleted: 0, changed: 0, unchanged: 0 };
    if (col === "profiles") Object.assign(r, { changedOnlyProfileStatus: 0, changedOutsideProfileStatus: 0, profileStatusAdded: 0, preexistingProfileStatusAltered: 0 });
    for (const id of Object.keys(A)) {
      if (!(id in B)) { r.deleted++; continue; }
      if (A[id].full === B[id].full) { r.unchanged++; continue; }
      r.changed++;
      if (col === "profiles") {
        if (A[id].rest === B[id].rest) r.changedOnlyProfileStatus++; else r.changedOutsideProfileStatus++;
        if (!A[id].hasStatus && B[id].hasStatus) r.profileStatusAdded++;
        if (A[id].hasStatus && A[id].statusHash !== B[id].statusHash) r.preexistingProfileStatusAltered++;
      }
    }
    for (const id of Object.keys(B)) if (!(id in A)) r.created++;
    out[col] = r;
  }
  console.log(JSON.stringify(out, null, 2));
}

if (cmd === "snapshot") snapshot().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
else if (cmd === "compare") compare();
else { console.error("usage: snapshot|compare"); process.exit(2); }
