// Firestore Security Rules tests for the InstMates website (W0.2 / W0.3).
// Runs ONLY against the Firebase Local Emulator Suite:
//   firebase emulators:exec --only firestore,storage --project demo-instmates-web "npm --prefix firestore-tests test"
import { test, before, after, beforeEach, describe } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, basename } from "node:path";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection,
  getDocs, query, where, serverTimestamp, Timestamp,
} from "firebase/firestore";

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT = "demo-instmates-web";
// RULES_FILE selects the variant under test: firestore.rules (W0 STRICT,
// default) or firestore.legacy-compat.rules. Legacy-shape expectations flip.
const RULES_FILE = resolve(process.env.RULES_FILE || join(here, "..", "firestore.rules"));
const STRICT = !/legacy-compat/.test(basename(RULES_FILE));

const A = "user_a";
const B = "user_b";
const C = "legacy_c";
const D = "legacy_private_d";
const EMAIL_A = "a@example.com";
const EMAIL_B = "b@example.com";
const STORAGE_URL = "https://firebasestorage.googleapis.com/v0/b/instmates.firebasestorage.app/o/profilePhotos%2Fuser_a?alt=media&token=x";

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: readFileSync(RULES_FILE, "utf8") },
  });
});

after(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users", A), {
      uid: A, name: "Alice", email: EMAIL_A, role: "user", verified: false,
      profileCompleted: false, followersCount: 0, followingCount: 0, postsCount: 0,
      createdAt: Timestamp.now(),
    });
    await setDoc(doc(db, "profiles", A), publicProfile("Alice"));
    await setDoc(doc(db, "profiles", B), { ...publicProfile("Bob"), profileStatus: { isPublic: false, completionPercent: 10 } });
    await setDoc(doc(db, "profiles", C), { fullName: "Legacy Carol", role: "Technician", bio: "", skills: ["GC"] });
    await setDoc(doc(db, "profiles", D), { fullName: "Legacy Dan", role: "Technician", publicProfile: false });
    await setDoc(doc(db, "posts", "p1"), validPost(A));
    await setDoc(doc(db, "posts", "p1", "comments", "c1"), { content: "hi", uid: B, createdAt: Timestamp.now() });
    await setDoc(doc(db, "questions", "q1"), { title: "t", body: "b" });
    await setDoc(doc(db, "chats", "chat1"), { users: [A, B] });
  });
});

function publicProfile(name) {
  return {
    basicInfo: { fullName: name, headline: "Technician", location: "" },
    professional: { specialization: "", analyzersWorked: [] },
    achievement: {},
    profileStatus: { isPublic: true, completionPercent: 10 },
    createdAt: Timestamp.now(),
  };
}

function validPost(uid, extra = {}) {
  return {
    content: "GC baseline drifting", uid, type: "question", attachment: null,
    createdAt: Timestamp.now(), editedAt: null,
    reactions: { agree: 0, faced: 0, helpful: 0 }, votedBy: {}, tags: ["gc"],
    ...extra,
  };
}

const anon = () => env.unauthenticatedContext().firestore();
const as = (uid, email) => env.authenticatedContext(uid, { email, email_verified: true }).firestore();

/* ================================================================== */
describe("users/{uid}", () => {
  test("anonymous cannot read a user document", async () => {
    await assertFails(getDoc(doc(anon(), "users", A)));
  });
  test("another signed-in member cannot read a user document (email exposure closed)", async () => {
    await assertFails(getDoc(doc(as(B, EMAIL_B), "users", A)));
  });
  test("owner can read own user document", async () => {
    await assertSucceeds(getDoc(doc(as(A, EMAIL_A), "users", A)));
  });
  test("owner can create own user document with the registration shape", async () => {
    await assertSucceeds(setDoc(doc(as(B, EMAIL_B), "users", B), {
      uid: B, name: "Bob", email: EMAIL_B, role: "user", verified: false,
      profileCompleted: false, followersCount: 0, followingCount: 0, postsCount: 0,
      createdAt: serverTimestamp(),
    }));
  });
  test("create with role=admin is denied", async () => {
    await assertFails(setDoc(doc(as(B, EMAIL_B), "users", B), {
      uid: B, name: "Bob", email: EMAIL_B, role: "admin", verified: false,
      profileCompleted: false, followersCount: 0, followingCount: 0, postsCount: 0,
      createdAt: serverTimestamp(),
    }));
  });
  test("create with verified=true is denied", async () => {
    await assertFails(setDoc(doc(as(B, EMAIL_B), "users", B), {
      uid: B, name: "Bob", email: EMAIL_B, role: "user", verified: true,
      profileCompleted: false, followersCount: 0, followingCount: 0, postsCount: 0,
      createdAt: serverTimestamp(),
    }));
  });
  test("create with an email that is not the token email is denied", async () => {
    await assertFails(setDoc(doc(as(B, EMAIL_B), "users", B), {
      uid: B, name: "Bob", email: "someone-else@example.com", role: "user", verified: false,
      profileCompleted: false, followersCount: 0, followingCount: 0, postsCount: 0,
      createdAt: serverTimestamp(),
    }));
  });
  test("owner can mark profileCompleted", async () => {
    await assertSucceeds(updateDoc(doc(as(A, EMAIL_A), "users", A), { profileCompleted: true, updatedAt: serverTimestamp() }));
  });
  test("owner cannot change role / verified / email / counters", async () => {
    await assertFails(updateDoc(doc(as(A, EMAIL_A), "users", A), { role: "admin" }));
    await assertFails(updateDoc(doc(as(A, EMAIL_A), "users", A), { verified: true }));
    await assertFails(updateDoc(doc(as(A, EMAIL_A), "users", A), { email: "x@example.com" }));
    await assertFails(updateDoc(doc(as(A, EMAIL_A), "users", A), { followersCount: 999 }));
  });
  test("another member cannot update a user document", async () => {
    await assertFails(updateDoc(doc(as(B, EMAIL_B), "users", A), { profileCompleted: true }));
  });
  test("owner cannot delete own user document", async () => {
    await assertFails(deleteDoc(doc(as(A, EMAIL_A), "users", A)));
  });
});

/* ================================================================== */
describe("profiles/{uid} – read boundary", () => {
  test("anonymous can read a public profile", async () => {
    await assertSucceeds(getDoc(doc(anon(), "profiles", A)));
  });
  test("anonymous cannot read a private profile (rules layer, not client filter)", async () => {
    await assertFails(getDoc(doc(anon(), "profiles", B)));
  });
  test("another member cannot read a private profile", async () => {
    await assertFails(getDoc(doc(as(A, EMAIL_A), "profiles", B)));
  });
  test("owner can read own private profile", async () => {
    await assertSucceeds(getDoc(doc(as(B, EMAIL_B), "profiles", B)));
  });
  test("legacy profile without profileStatus: " + (STRICT ? "DENIED (strict W0)" : "reachable by direct link (legacy-compat variant)"), async () => {
    const op = getDoc(doc(anon(), "profiles", C));
    if (STRICT) await assertFails(op); else await assertSucceeds(op);
  });
  test("legacy profile without profileStatus is never listable, in either variant", async () => {
    const snap = await assertSucceeds(getDocs(query(collection(anon(), "profiles"), where("profileStatus.isPublic", "==", true))));
    if (snap.docs.some((d) => d.id === C)) throw new Error("legacy doc appeared in directory");
  });
  test("backfilled shapes: public listed+readable, ambiguous-default-private denied, owner still reads own", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "profiles", "bf_pub"), { fullName: "X", role: "Technician", publicProfile: true, profileStatus: { isPublic: true } });
      await setDoc(doc(db, "profiles", "bf_priv"), { fullName: "Y", role: "Technician", skills: [], profileStatus: { isPublic: false } });
      await setDoc(doc(db, "profiles", "bf_legacy_priv"), { fullName: "Z", publicProfile: false, profileStatus: { isPublic: false } });
    });
    await assertSucceeds(getDoc(doc(anon(), "profiles", "bf_pub")));
    await assertFails(getDoc(doc(anon(), "profiles", "bf_priv")));
    await assertFails(getDoc(doc(anon(), "profiles", "bf_legacy_priv")));
    await assertSucceeds(getDoc(doc(as("bf_priv", "p@example.com"), "profiles", "bf_priv")));
    const snap = await assertSucceeds(getDocs(query(collection(anon(), "profiles"), where("profileStatus.isPublic", "==", true))));
    const ids = snap.docs.map((d) => d.id);
    if (!ids.includes("bf_pub") || ids.includes("bf_priv") || ids.includes("bf_legacy_priv")) throw new Error("directory mismatch " + ids);
  });
  test("profileStatus present but isPublic missing or non-boolean -> not public", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "profiles", "ps_empty"), { fullName: "E", profileStatus: {} });
      await setDoc(doc(db, "profiles", "ps_str"), { fullName: "S", profileStatus: { isPublic: "true" } });
    });
    await assertFails(getDoc(doc(anon(), "profiles", "ps_empty")));
    await assertFails(getDoc(doc(anon(), "profiles", "ps_str")));
  });
  test("legacy profile with publicProfile=false is private", async () => {
    await assertFails(getDoc(doc(anon(), "profiles", D)));
  });
  test("anonymous can list profiles when the query is constrained to public ones", async () => {
    const snap = await assertSucceeds(getDocs(query(collection(anon(), "profiles"), where("profileStatus.isPublic", "==", true))));
    const ids = snap.docs.map((d) => d.id);
    if (!ids.includes(A) || ids.includes(B)) throw new Error("unexpected list result " + ids);
  });
  test("unconstrained profile listing is denied (rules are not filters)", async () => {
    await assertFails(getDocs(collection(anon(), "profiles")));
    await assertFails(getDocs(collection(as(A, EMAIL_A), "profiles")));
  });
});

describe("profiles/{uid} – write boundary", () => {
  test("owner can create own profile with the registration shape; doc id must be own uid", async () => {
    await env.clearFirestore();
    await assertFails(setDoc(doc(as(B, EMAIL_B), "profiles", "user_new"), publicProfile("New")));
    await assertSucceeds(setDoc(doc(as(B, EMAIL_B), "profiles", B), publicProfile("Bob")));
  });
  test("create with isVerified=true is denied", async () => {
    await env.clearFirestore();
    await assertFails(setDoc(doc(as(B, EMAIL_B), "profiles", B), { ...publicProfile("Bob"), isVerified: true }));
  });
  test("create with any unknown top-level key is denied", async () => {
    await env.clearFirestore();
    await assertFails(setDoc(doc(as(B, EMAIL_B), "profiles", B), { ...publicProfile("Bob"), role: "admin" }));
    await assertFails(setDoc(doc(as(B, EMAIL_B), "profiles", B), { ...publicProfile("Bob"), stats: { uptime: 99 } }));
  });
  test("owner can save the edit-profile form shape", async () => {
    await assertSucceeds(updateDoc(doc(as(A, EMAIL_A), "profiles", A), {
      basicInfo: { fullName: "Alice K", headline: "GC specialist", location: "Duqm, Oman", profilePhoto: null },
      professional: { specialization: "Process GC", analyzersWorked: ["GC8000", "FTIR"] },
      profileStatus: { isPublic: true, completionPercent: 67 },
    }));
  });
  test("owner can set a Firebase Storage profile photo URL, but not an external one", async () => {
    await assertSucceeds(updateDoc(doc(as(A, EMAIL_A), "profiles", A), { "basicInfo.profilePhoto": STORAGE_URL }));
    await assertFails(updateDoc(doc(as(A, EMAIL_A), "profiles", A), { "basicInfo.profilePhoto": "https://evil.example/x.png" }));
    await assertFails(updateDoc(doc(as(A, EMAIL_A), "profiles", A), { "basicInfo.profilePhoto": "javascript:alert(1)" }));
  });
  test("owner can make own profile private and public again", async () => {
    await assertSucceeds(updateDoc(doc(as(A, EMAIL_A), "profiles", A), { "profileStatus.isPublic": false }));
    await assertFails(getDoc(doc(anon(), "profiles", A)));
    await assertSucceeds(updateDoc(doc(as(A, EMAIL_A), "profiles", A), { "profileStatus.isPublic": true }));
    await assertSucceeds(getDoc(doc(anon(), "profiles", A)));
  });
  test("owner cannot self-assign isVerified / verified / role / admin / stats / subscription", async () => {
    for (const patch of [
      { isVerified: true }, { verified: true }, { role: "admin" }, { isAdmin: true },
      { stats: { uptime: 99.2 } }, { subscriptionTier: "pro" }, { isPro: true },
      { "profileStatus.isVerified": true },
    ]) {
      await assertFails(updateDoc(doc(as(A, EMAIL_A), "profiles", A), patch));
    }
  });
  test("oversized or mistyped fields are denied", async () => {
    await assertFails(updateDoc(doc(as(A, EMAIL_A), "profiles", A), { "basicInfo.fullName": "x".repeat(101) }));
    await assertFails(updateDoc(doc(as(A, EMAIL_A), "profiles", A), { "basicInfo.fullName": 12345 }));
    await assertFails(updateDoc(doc(as(A, EMAIL_A), "profiles", A), { "basicInfo.experienceYears": 500 }));
    await assertFails(updateDoc(doc(as(A, EMAIL_A), "profiles", A), { "profileStatus.completionPercent": 150 }));
    await assertFails(updateDoc(doc(as(A, EMAIL_A), "profiles", A), { "basicInfo.unknownField": "x" }));
  });
  test("another member cannot update a profile", async () => {
    await assertFails(updateDoc(doc(as(B, EMAIL_B), "profiles", A), { "basicInfo.headline": "pwned" }));
  });
  test("legacy flat profile can be edited by its owner through the new maps", async () => {
    await assertSucceeds(updateDoc(doc(as(C, "c@example.com"), "profiles", C), {
      basicInfo: { fullName: "Carol", headline: "", location: "" },
      professional: { specialization: "", analyzersWorked: [] },
      profileStatus: { isPublic: true, completionPercent: 20 },
    }));
  });
  test("nobody can delete a profile", async () => {
    await assertFails(deleteDoc(doc(as(A, EMAIL_A), "profiles", A)));
  });
});

/* ================================================================== */
describe("posts", () => {
  test("anonymous can read posts and comments", async () => {
    await assertSucceeds(getDoc(doc(anon(), "posts", "p1")));
    await assertSucceeds(getDocs(collection(anon(), "posts", "p1", "comments")));
  });
  test("anonymous cannot create a post", async () => {
    await assertFails(addDoc(collection(anon(), "posts"), validPost(A)));
  });
  test("member can create a valid post", async () => {
    await assertSucceeds(addDoc(collection(as(A, EMAIL_A), "posts"), validPost(A)));
  });
  test("post uid must match the caller", async () => {
    await assertFails(addDoc(collection(as(B, EMAIL_B), "posts"), validPost(A)));
  });
  test("post validation: type, content length, tags, unknown keys", async () => {
    await assertFails(addDoc(collection(as(A, EMAIL_A), "posts"), validPost(A, { type: "shutdown" })));
    await assertFails(addDoc(collection(as(A, EMAIL_A), "posts"), validPost(A, { content: "x".repeat(5001) })));
    await assertFails(addDoc(collection(as(A, EMAIL_A), "posts"), validPost(A, { tags: ["1", "2", "3", "4", "5", "6"] })));
    await assertFails(addDoc(collection(as(A, EMAIL_A), "posts"), validPost(A, { pinned: true })));
    await assertFails(addDoc(collection(as(A, EMAIL_A), "posts"), validPost(A, { reactions: { agree: 999, faced: 0, helpful: 0 } })));
  });
  test("attachment must be a Firebase Storage URL", async () => {
    await assertSucceeds(addDoc(collection(as(A, EMAIL_A), "posts"), validPost(A, { attachment: { url: STORAGE_URL, type: "pdf", name: "a.pdf" } })));
    await assertFails(addDoc(collection(as(A, EMAIL_A), "posts"), validPost(A, { attachment: { url: "https://evil.example/a.pdf", type: "pdf", name: "a.pdf" } })));
    await assertFails(addDoc(collection(as(A, EMAIL_A), "posts"), validPost(A, { attachment: { url: STORAGE_URL, type: "html", name: "a" } })));
  });
  test("owner can edit content; others cannot", async () => {
    await assertSucceeds(updateDoc(doc(as(A, EMAIL_A), "posts", "p1"), { content: "edited", editedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as(B, EMAIL_B), "posts", "p1"), { content: "hijack", editedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as(A, EMAIL_A), "posts", "p1"), { content: "x".repeat(5001), editedAt: serverTimestamp() }));
  });
  test("one reaction per member per post", async () => {
    await assertSucceeds(updateDoc(doc(as(B, EMAIL_B), "posts", "p1"), { "reactions.agree": 1, [`votedBy.${B}`]: true }));
    await assertFails(updateDoc(doc(as(B, EMAIL_B), "posts", "p1"), { "reactions.helpful": 1, [`votedBy.${B}`]: true }));
  });
  test("nobody can delete a post (unchanged pre-W0 behaviour)", async () => {
    await assertFails(deleteDoc(doc(as(A, EMAIL_A), "posts", "p1")));
  });
  test("comments: member create with exact shape; no update/delete", async () => {
    await assertSucceeds(addDoc(collection(as(B, EMAIL_B), "posts", "p1", "comments"), { content: "ok", uid: B, createdAt: serverTimestamp() }));
    await assertFails(addDoc(collection(as(B, EMAIL_B), "posts", "p1", "comments"), { content: "ok", uid: A, createdAt: serverTimestamp() }));
    await assertFails(addDoc(collection(as(B, EMAIL_B), "posts", "p1", "comments"), { content: "ok", uid: B, createdAt: serverTimestamp(), pinned: true }));
    await assertFails(addDoc(collection(as(B, EMAIL_B), "posts", "p1", "comments"), { content: "x".repeat(2001), uid: B, createdAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as(B, EMAIL_B), "posts", "p1", "comments", "c1"), { content: "edited" }));
    await assertFails(deleteDoc(doc(as(B, EMAIL_B), "posts", "p1", "comments", "c1")));
  });
});

/* ================================================================== */
describe("collections without rules stay denied", () => {
  test("questions / chats are unreadable and unwritable, even for members", async () => {
    await assertFails(getDoc(doc(anon(), "questions", "q1")));
    await assertFails(getDoc(doc(as(A, EMAIL_A), "questions", "q1")));
    await assertFails(addDoc(collection(as(A, EMAIL_A), "questions"), { title: "t" }));
    await assertFails(getDoc(doc(as(A, EMAIL_A), "chats", "chat1")));
    await assertFails(addDoc(collection(as(A, EMAIL_A), "messages"), { toUid: B, message: "hi" }));
  });
});
