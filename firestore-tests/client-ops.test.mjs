// Client-compatibility suite (W0 gate items 7 and 8).
//
// Executes the EXACT Firestore operations that the W0 website JavaScript
// performs, against whichever rules file RULES_FILE points to, so the same
// suite proves the W0 client works under:
//   RULES_FILE=<deployed old rules>            (production before rules deploy)
//   RULES_FILE=firestore.rules                 (W0 STRICT, default)
//   RULES_FILE=firestore.legacy-compat.rules   (rollback-only variant)
//
// Operations mirrored (file:line refers to public/ at W0):
//   profiles.js:35  / technicians.js:45  getDocs(query(profiles, where("profileStatus.isPublic","==",true)))
//   feed.js listenPosts                  query(posts, orderBy(createdAt desc), limit(20))
//   feed.js loadUsersFor                 getDoc(profiles/{authorUid}) per author
//   feed.js create post                  addDoc(posts, {...}) exact shape
//   feed.js comment                      addDoc(posts/{id}/comments, {content, uid, createdAt})
//   feed.js react                        updateDoc(posts/{id}, {"reactions.agree": increment(1), ["votedBy."+uid]: true})
//   feed.js edit                         updateDoc(posts/{id}, {content, editedAt})
//   edit-profile.js save                 updateDoc(profiles/{uid}, {basicInfo, professional, profileStatus})
//   auth.js register                     setDoc(users/{uid}, {...}) + setDoc(profiles/{uid}, {...}) exact shapes
//   auth-guard.js                        getDoc(users/{own uid})
//   profile/index.html                   getDoc(profiles/{uid})
import { test, before, after, beforeEach, describe } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, basename } from "node:path";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import {
  doc, getDoc, setDoc, updateDoc, addDoc, collection, getDocs, query, where,
  orderBy, limit, serverTimestamp, Timestamp, increment,
} from "firebase/firestore";

const here = dirname(fileURLToPath(import.meta.url));
const RULES_FILE = resolve(process.env.RULES_FILE || join(here, "..", "firestore.rules"));
const VARIANT = /legacy-compat/.test(basename(RULES_FILE)) ? "w0" : /deployed|old/.test(basename(RULES_FILE)) ? "old" : "strict";
// Separate emulator project id so this suite never shares state with
// rules.test.mjs when node --test runs files concurrently.
const PROJECT = "demo-instmates-ops";

const A = "user_a", B = "user_b", LEGACY = "legacy_c", LEGACY_PRIV = "legacy_d";
const EMAIL_A = "a@example.com", EMAIL_B = "b@example.com";
const STORAGE_URL = "https://firebasestorage.googleapis.com/v0/b/instmates.firebasestorage.app/o/profilePhotos%2Fuser_a?alt=media&token=x";

let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: PROJECT, firestore: { rules: readFileSync(RULES_FILE, "utf8") } });
});
after(async () => { await env.cleanup(); });

const nested = (name, isPublic = true) => ({
  basicInfo: { fullName: name, headline: "Technician", location: "" },
  professional: { specialization: "", analyzersWorked: [] },
  achievement: {},
  profileStatus: { isPublic, completionPercent: 10 },
  createdAt: Timestamp.now(),
});
const post = (uid) => ({
  content: "GC baseline drifting", uid, type: "question", attachment: null,
  createdAt: Timestamp.now(), editedAt: null, reactions: { agree: 0, faced: 0, helpful: 0 }, votedBy: {}, tags: ["gc"],
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users", A), { uid: A, name: "Alice", email: EMAIL_A, role: "user", verified: false, profileCompleted: false, followersCount: 0, followingCount: 0, postsCount: 0, createdAt: Timestamp.now() });
    await setDoc(doc(db, "profiles", A), nested("Alice", true));
    await setDoc(doc(db, "profiles", B), nested("Bob", false));
    await setDoc(doc(db, "profiles", LEGACY), { fullName: "Legacy", role: "Technician", skills: [] });
    await setDoc(doc(db, "profiles", LEGACY_PRIV), { fullName: "Legacy Private", role: "Technician", publicProfile: false });
    // backfilled shapes (what backfill-profile-status.mjs writes)
    // backfilled shapes: legacy fields untouched + exactly profileStatus.isPublic (no provenance marker on member docs)
    await setDoc(doc(db, "profiles", "backfilled_public"), { fullName: "BF Public", role: "Technician", publicProfile: true, profileStatus: { isPublic: true } });
    await setDoc(doc(db, "profiles", "backfilled_private"), { fullName: "BF Private", role: "Technician", skills: [], profileStatus: { isPublic: false } });
    await setDoc(doc(db, "posts", "p1"), post(A));
    await setDoc(doc(db, "posts", "p_legacy_author"), post(LEGACY));
  });
});

const anon = () => env.unauthenticatedContext().firestore();
const as = (uid, email) => env.authenticatedContext(uid, { email, email_verified: true }).firestore();

describe(`client operations under ${VARIANT} rules (${basename(RULES_FILE)})`, () => {

  test("PUBLIC FILTERED DIRECTORY QUERY (profiles.js / technicians.js exact query) -> ALLOWED, returns only public docs", async () => {
    const snap = await assertSucceeds(getDocs(query(collection(anon(), "profiles"), where("profileStatus.isPublic", "==", true))));
    const ids = snap.docs.map((d) => d.id).sort();
    const expected = ["backfilled_public", A].sort();
    if (JSON.stringify(ids) !== JSON.stringify(expected)) throw new Error(`directory returned ${ids}`);
  });

  test("UNFILTERED PROFILE LIST -> " + (VARIANT === "old" ? "ALLOWED under old rules (that is the pre-W0 leak)" : "DENIED"), async () => {
    const op = getDocs(collection(anon(), "profiles"));
    if (VARIANT === "old") await assertSucceeds(op); else await assertFails(op);
  });

  test("PUBLIC PROFILE DIRECT GET -> ALLOWED (anonymous)", async () => {
    await assertSucceeds(getDoc(doc(anon(), "profiles", A)));
    await assertSucceeds(getDoc(doc(anon(), "profiles", "backfilled_public")));
  });

  test("PRIVATE PROFILE DIRECT GET -> " + (VARIANT === "old" ? "ALLOWED under old rules (pre-W0 leak)" : "DENIED"), async () => {
    for (const id of [B, "backfilled_private"]) {
      const op = getDoc(doc(anon(), "profiles", id));
      if (VARIANT === "old") await assertSucceeds(op); else await assertFails(op);
    }
  });

  test("OWNER PRIVATE PROFILE GET -> ALLOWED", async () => {
    await assertSucceeds(getDoc(doc(as(B, EMAIL_B), "profiles", B)));
  });

  test("CROSS-USER PRIVATE PROFILE GET -> " + (VARIANT === "old" ? "ALLOWED under old rules" : "DENIED"), async () => {
    const op = getDoc(doc(as(A, EMAIL_A), "profiles", B));
    if (VARIANT === "old") await assertSucceeds(op); else await assertFails(op);
  });

  test("LEGACY profile without profileStatus, direct GET -> " + ({ old: "ALLOWED", w0: "ALLOWED (legacy-compat variant)", strict: "DENIED (W0 strict)" })[VARIANT], async () => {
    const op = getDoc(doc(anon(), "profiles", LEGACY));
    if (VARIANT === "strict") await assertFails(op); else await assertSucceeds(op);
  });

  test("LEGACY profile with publicProfile=false, direct GET -> " + (VARIANT === "old" ? "ALLOWED (pre-W0 leak)" : "DENIED"), async () => {
    const op = getDoc(doc(anon(), "profiles", LEGACY_PRIV));
    if (VARIANT === "old") await assertSucceeds(op); else await assertFails(op);
  });

  test("ANONYMOUS users/{uid} GET -> DENIED", async () => {
    await assertFails(getDoc(doc(anon(), "users", A)));
  });

  test("CROSS-USER users/{uid} GET -> " + (VARIANT === "old" ? "ALLOWED under old rules (email exposure)" : "DENIED"), async () => {
    const op = getDoc(doc(as(B, EMAIL_B), "users", A));
    if (VARIANT === "old") await assertSucceeds(op); else await assertFails(op);
  });

  test("OWNER users/{uid} GET (auth-guard.js) -> ALLOWED", async () => {
    await assertSucceeds(getDoc(doc(as(A, EMAIL_A), "users", A)));
  });

  test("OWNER isVerified WRITE -> " + (VARIANT === "old" ? "ALLOWED under old rules (self-verification hole)" : "DENIED"), async () => {
    const op = updateDoc(doc(as(A, EMAIL_A), "profiles", A), { isVerified: true });
    if (VARIANT === "old") await assertSucceeds(op); else await assertFails(op);
  });

  test("OWNER NORMAL PROFILE EDIT (edit-profile.js exact shape) -> ALLOWED", async () => {
    await assertSucceeds(updateDoc(doc(as(A, EMAIL_A), "profiles", A), {
      basicInfo: { fullName: "Alice K", headline: "GC specialist", location: "Duqm, Oman", profilePhoto: STORAGE_URL },
      professional: { specialization: "Process GC", analyzersWorked: ["GC8000"] },
      profileStatus: { isPublic: true, completionPercent: 83 },
    }));
  });

  test("OWNER EDIT of a BACKFILLED legacy document -> ALLOWED; legacy keys stay untouched", async () => {
    const db = as("backfilled_public", "bf@example.com");
    await assertSucceeds(updateDoc(doc(db, "profiles", "backfilled_public"), {
      basicInfo: { fullName: "BF Public", headline: "", location: "", profilePhoto: null },
      professional: { specialization: "", analyzersWorked: [] },
      profileStatus: { isPublic: true, completionPercent: 17 },
    }));
    // legacy flat keys are outside the owner allow-list under W0 rules
    const touchLegacy = updateDoc(doc(db, "profiles", "backfilled_public"), { role: "admin" });
    if (VARIANT === "old") await assertSucceeds(touchLegacy); else await assertFails(touchLegacy);
  });

  test("REGISTRATION (auth.js exact users + profiles setDoc) -> ALLOWED", async () => {
    const db = as("user_new", "new@example.com");
    await assertSucceeds(setDoc(doc(db, "users", "user_new"), { uid: "user_new", name: "New Member", email: "new@example.com", role: "user", verified: false, profileCompleted: false, followersCount: 0, followingCount: 0, postsCount: 0, createdAt: serverTimestamp() }));
    await assertSucceeds(setDoc(doc(db, "profiles", "user_new"), { basicInfo: { fullName: "New Member", headline: "Technician", location: "" }, professional: { specialization: "", analyzersWorked: [] }, achievement: {}, profileStatus: { isPublic: true, completionPercent: 10 }, createdAt: serverTimestamp() }));
  });

  test("FEED: posts listener query + per-author profile lookup (feed.js) -> ALLOWED anonymously; legacy author falls back", async () => {
    const db = anon();
    const snap = await assertSucceeds(getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20))));
    for (const d of snap.docs) {
      const uid = d.data().uid;
      const r = await getDoc(doc(db, "profiles", uid)).then((s) => (s.exists() ? "ok" : "missing"), () => "denied");
      if (uid === A && r !== "ok") throw new Error("public author lookup failed");
      if (uid === LEGACY && VARIANT === "strict" && r !== "denied") throw new Error("strict rules should deny legacy author lookup (client falls back to 'Technician')");
    }
  });

  test("FEED: create post, comment, react, edit (feed.js exact shapes) -> ALLOWED for a member", async () => {
    const db = as(B, EMAIL_B);
    const ref = await assertSucceeds(addDoc(collection(db, "posts"), { ...post(B), createdAt: serverTimestamp(), attachment: { url: STORAGE_URL, type: "image", name: "x.png" } }));
    await assertSucceeds(addDoc(collection(db, "posts", ref.id, "comments"), { content: "seen this", uid: B, createdAt: serverTimestamp() }));
    const react = updateDoc(doc(as(A, EMAIL_A), "posts", ref.id), { "reactions.agree": increment(1), [`votedBy.${A}`]: true });
    // Pre-W0 production rule indexes votedBy[uid] on a missing key, which throws
    // and denies every FIRST vote. W0 fixes it with get(uid, false).
    if (VARIANT === "old") await assertFails(react); else await assertSucceeds(react);
    await assertSucceeds(updateDoc(doc(db, "posts", ref.id), { content: "edited", editedAt: serverTimestamp() }));
  });
});
