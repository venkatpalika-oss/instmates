// P1.2 profile-completion contract tests: registration → /profile/edit/ → successful save →
// users/{uid}.profileCompleted=true → /feed/. Source-contract checks over the shipped files.
// Run: npm --prefix site-tests test   (no emulator, no network)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const read = (...parts) => readFileSync(path.join(...parts), "utf8").replace(/\r\n/g, "\n");
// Comments are removed before behavioural checks so that prose can never satisfy or break a contract.
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

const AUTH_JS = read(PUBLIC_DIR, "assets", "js", "auth.js");
const GUARD_JS = read(PUBLIC_DIR, "assets", "js", "auth-guard.js");
const REGISTER_HTML = read(PUBLIC_DIR, "register.html");
const FEED_HTML = read(PUBLIC_DIR, "feed", "index.html");
const EDIT_HTML = read(PUBLIC_DIR, "profile", "edit", "index.html");
const EDIT_WRITER_PATH = path.join(PUBLIC_DIR, "profile", "edit", "edit-profile.js");
const EDIT_JS = read(EDIT_WRITER_PATH);
const RULES = read(ROOT, "firestore.rules");

// Navigation statements only (a form field or map key named "location" is not a navigation).
const NAVIGATION = /window\.location\.(?:replace|assign)\s*\([^)]*\)|window\.location(?:\.href)?\s*=[^=][^;\n]*/g;
const NAVIGATES = /window\.location|\blocation\.(?:href|replace|assign)\b/;
const registerUser = code(AUTH_JS).match(/window\.registerUser\s*=\s*async function[\s\S]*?\n\};/)[0];
const registerHandler = code(REGISTER_HTML.match(/<script type="module">([\s\S]*?handleRegister[\s\S]*?)<\/script>/)[1]);
const guard = code(GUARD_JS);
const editCode = code(EDIT_JS);
const saveHandler = editCode.slice(editCode.indexOf('form.addEventListener("submit"'));

// ---------------------------------------------------------------- registration
test("registration: registerUser creates the account state and does not own navigation", () => {
  assert.match(registerUser, /createUserWithEmailAndPassword\(auth, email, password\)/);
  assert.match(registerUser, /setDoc\(doc\(db, "users", cred\.user\.uid\)/, "users document is still created");
  assert.match(registerUser, /setDoc\(doc\(db, "profiles", cred\.user\.uid\)/, "profiles document is still created");
  assert.match(registerUser, /profileCompleted:\s*false/, "registration contract: a new member starts incomplete");
  assert.match(registerUser, /return cred;/, "control returns to the caller");
  assert.doesNotMatch(registerUser, NAVIGATES, "registerUser must not navigate (no competing /profile/?uid= redirect)");
});

test("registration: register.html is the single authority and sends new members to /profile/edit/", () => {
  const callers = [...code(AUTH_JS + REGISTER_HTML + GUARD_JS + EDIT_JS).matchAll(/window\.registerUser\s*\(/g)];
  assert.equal(callers.length, 1, "registerUser has exactly one caller");
  const navigations = registerHandler.match(NAVIGATION) || [];
  assert.deepEqual(navigations, ['window.location.replace("/profile/edit/")'], "exactly one success navigation");
  assert.ok(
    registerHandler.indexOf("await window.registerUser(") < registerHandler.indexOf('window.location.replace("/profile/edit/")'),
    "navigation happens only after registerUser resolved");
  const catchBlock = registerHandler.slice(registerHandler.indexOf("catch"));
  assert.doesNotMatch(catchBlock, NAVIGATES, "a failed registration does not navigate");
});

test("registration: the deleted /profile-edit.html destination is gone from the active path", () => {
  for (const [name, src] of [["register.html", REGISTER_HTML], ["auth.js", AUTH_JS], ["auth-guard.js", GUARD_JS], ["edit-profile.js", EDIT_JS]]) {
    assert.ok(!src.includes("profile-edit.html"), `${name} still references /profile-edit.html`);
  }
  assert.ok(!existsSync(path.join(PUBLIC_DIR, "profile-edit.html")), "the legacy page does not exist");
});

// ---------------------------------------------------------------- guard
test("guard: an incomplete signed-in member is sent to /profile/edit/ and the edit page itself is exempt", () => {
  assert.match(guard, /userSnap\.exists\(\)\s*&&\s*userSnap\.data\(\)\.profileCompleted === true/, "only an explicit true counts as complete");
  assert.match(
    guard,
    /if\s*\(\s*!profileCompleted\s*&&\s*page\s*!==\s*"profile-edit"\s*\)\s*\{\s*window\.location\.replace\("\/profile\/edit\/"\);\s*return;/,
    "incomplete → /profile/edit/, except on the page keyed profile-edit");
  assert.ok(!guard.includes("/profile/?uid="), "the read-only profile view is no longer the incomplete-member destination");
  assert.match(EDIT_HTML, /<body data-page="profile-edit">/, "the exemption uses the real page identity of the live edit page");
});

test("guard: signed-out behaviour is unchanged — the feed stays readable, private pages still require login", () => {
  const privatePages = [...guard.match(/const PRIVATE_PAGES = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(privatePages, ["dashboard", "inbox", "message", "chat", "ask", "submit-case"]);
  assert.ok(!privatePages.includes("feed"), "feed is not a login-only page");
  const signedOut = guard.match(/if \(!user\) \{([\s\S]*?)return;/)[1];
  assert.match(signedOut, /if \(PRIVATE_PAGES\.includes\(page\)\) \{\s*window\.location\.replace\("\/login\/"\);/);
  assert.match(guard, /REDIRECT_IF_LOGGED_IN\.includes\(page\)\) \{\s*window\.location\.replace\("\/feed\/"\);/, "completed members still continue to the feed");
  assert.match(FEED_HTML, /<body data-page="feed">/);
  assert.ok(!FEED_HTML.includes("feed-guard.js"), "the feed page does not load a login-only guard");
});

// ---------------------------------------------------------------- live edit writer
test("edit page: the canonical live writer is /profile/edit/edit-profile.js (not a file under assets/js)", () => {
  assert.match(EDIT_HTML, /<script type="module" src="\/profile\/edit\/edit-profile\.js[^"]*"><\/script>/);
  assert.ok(existsSync(EDIT_WRITER_PATH));
  assert.ok(!existsSync(path.join(PUBLIC_DIR, "assets", "js", "edit-profile.js")), "there is no second edit-profile.js");
  assert.match(EDIT_HTML, /<input type="text" id="fullName" required \/>/, "existing validation contract: fullName required");
  const required = [...EDIT_HTML.matchAll(/<(?:input|select|textarea)\b[^>]*\brequired\b[^>]*>/g)];
  assert.equal(required.length, 1, "P1.2 adds no new required field");
});

test("edit page: a successful save marks users/{uid} complete with updatedAt", () => {
  assert.match(EDIT_JS, /import \{[^}]*\bserverTimestamp\b[^}]*\} from "https:\/\/www\.gstatic\.com\/firebasejs\/9\.23\.0\/firebase-firestore\.js";/);
  assert.match(
    saveHandler,
    /await updateDoc\(doc\(db, "users", user\.uid\), \{\s*profileCompleted: true,\s*updatedAt: serverTimestamp\(\)\s*\}\);/,
    "exact completion transition permitted by the rules");
  assert.equal((saveHandler.match(/doc\(db, "users", user\.uid\)/g) || []).length, 1, "one users write");
});

test("edit page: order is profile save → completion write → /feed/, and a failure never completes or navigates", () => {
  const profileWrite = saveHandler.indexOf('await updateDoc(doc(db, "profiles", user.uid)');
  const completionWrite = saveHandler.indexOf('await updateDoc(doc(db, "users", user.uid)');
  const feedNavigation = saveHandler.indexOf('window.location.href = "/feed/"');
  const catchAt = saveHandler.indexOf("} catch (err)");
  assert.ok(profileWrite > -1 && completionWrite > -1 && feedNavigation > -1 && catchAt > -1);
  assert.ok(saveHandler.indexOf("try {") < profileWrite, "both writes are inside the try block");
  assert.ok(profileWrite < completionWrite, "the profile is saved before completion is marked");
  assert.ok(completionWrite < feedNavigation, "the feed is opened only after completion is recorded");
  assert.ok(feedNavigation < catchAt, "navigation belongs to the success path");
  assert.deepEqual(saveHandler.match(NAVIGATION), ['window.location.href = "/feed/"'], "exactly one navigation in the save handler");
  const catchBlock = saveHandler.slice(catchAt);
  assert.doesNotMatch(catchBlock, new RegExp(NAVIGATES.source + "|profileCompleted"), "the failure path neither navigates nor marks completion");
  assert.match(catchBlock, /showToast\("Error saving profile", "error"\)/, "existing failure feedback kept");
});

test("privacy: saving never writes isPublic; only profileStatus.completionPercent is updated by field path", () => {
  assert.doesNotMatch(editCode, /isPublic/, "edit-profile.js must not write (or default) profileStatus.isPublic");
  assert.doesNotMatch(editCode, /profileStatus\s*:/, "the profileStatus map is never replaced wholesale");
  assert.match(
    saveHandler,
    /await updateDoc\(doc\(db, "profiles", user\.uid\), \{\s*\.\.\.profileData,\s*"profileStatus\.completionPercent": completion\s*\}\);/);
  assert.equal((editCode.match(/profileStatus/g) || []).length, 1, "completionPercent is the only profileStatus member touched");
});

// ---------------------------------------------------------------- rules (read-only contract; P1.2 needs no rule change)
test("rules: the existing contract already permits the P1.2 writes", () => {
  const users = RULES.match(/match \/users\/\{userId\} \{[\s\S]*?allow delete: if false;/)[0];
  assert.match(users, /incoming\(\)\.profileCompleted == false/, "registration must still create an incomplete member");
  assert.match(users, /affectedKeys\(\)\s*\.hasOnly\(\['name', 'profileCompleted', 'updatedAt'\]\)/, "owner may set profileCompleted and updatedAt");
  assert.match(users, /incoming\(\)\.profileCompleted is bool/);
  const status = RULES.match(/function validProfileStatus\(s\) \{[\s\S]*?\n    \}/)[0];
  assert.match(status, /s\.get\('isPublic', null\) == null \|\| s\.isPublic is bool/, "isPublic stays optional, so it can be left untouched");
  assert.match(status, /hasOnly\(\['isPublic', 'completionPercent', 'lastUpdated'\]\)/);
  assert.match(RULES, /affectedKeys\(\)\s*\.hasOnly\(\['basicInfo', 'professional', 'achievement', 'profileStatus'\]\)/, "a profileStatus field-path update stays inside the owner allow-list");
});
