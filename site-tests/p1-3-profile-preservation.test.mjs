// P1.3 profile-preservation contract tests: the ACTIVE editor (/profile/edit/edit-profile.js) writes only
// the leaves the form owns, by field path, so hidden siblings of basicInfo / professional / profileStatus
// survive an ordinary save. Source-contract checks over the shipped files (no emulator, no browser).
// Run: npm --prefix site-tests test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const read = (...parts) => readFileSync(path.join(...parts), "utf8").replace(/\r\n/g, "\n");
// Comments are removed before behavioural checks so that prose can never satisfy or break a contract.
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

const EDIT_HTML = read(PUBLIC_DIR, "profile", "edit", "index.html");
const EDIT_JS = read(PUBLIC_DIR, "profile", "edit", "edit-profile.js");
const DORMANT_JS = read(PUBLIC_DIR, "assets", "js", "profile.js");
const RULES = read(ROOT, "firestore.rules");

const editCode = code(EDIT_JS);
const saveHandler = editCode.slice(editCode.indexOf('form.addEventListener("submit"'));
const deleteHandler = editCode.slice(editCode.indexOf('deletePhotoBtn.addEventListener("click"'), editCode.indexOf('function calculateCompletion'));

// Every updateDoc(...) call in the save handler with its argument text.
const updateCalls = [...saveHandler.matchAll(/updateDoc\(\s*doc\(db, "(\w+)", user\.uid\),\s*([\s\S]*?)\);/g)]
  .map((m) => ({ collection: m[1], arg: m[2].trim() }));
const profilesCall = updateCalls.find((c) => c.collection === "profiles");
// The object literal the profiles write is built from.
const updateLiteral = saveHandler.match(/const update = \{([\s\S]*?)\};/)?.[1] ?? "";
const literalKeys = [...updateLiteral.matchAll(/"([^"]+)":/g)].map((m) => m[1]);
const conditionalKeys = [...saveHandler.matchAll(/update\["([^"]+)"\]\s*=/g)].map((m) => m[1]);

const OWNED_LEAVES = [
  "basicInfo.fullName", "basicInfo.headline", "basicInfo.location",
  "professional.specialization", "professional.analyzersWorked",
  "profileStatus.completionPercent",
];
const HIDDEN_SIBLINGS = ["experienceYears", "company", "plantType", "certifications", "lastUpdated", "isPublic"];

function allHtmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? allHtmlFiles(full) : name.endsWith(".html") ? [full] : [];
  });
}

// ---------------------------------------------------------------- write shape
test("save: the profiles write is the field-path update object, never a nested map", () => {
  assert.ok(profilesCall, "the save handler writes profiles/{uid} with updateDoc");
  assert.equal(profilesCall.arg, "update", "updateDoc receives the prepared update object, not an inline literal");
  assert.doesNotMatch(saveHandler, /\.\.\.profileData/, "profileData is never spread into a write");
  assert.doesNotMatch(updateLiteral, /\bbasicInfo\s*:|\bprofessional\s*:|\bprofileStatus\s*:|\bachievement\s*:/, "no whole-map key in the update object");
  assert.doesNotMatch(saveHandler, /updateDoc\([^;]*\b(?:basicInfo|professional|profileStatus)\s*:/, "no whole-map key in any updateDoc argument");
  assert.equal(updateCalls.length, 2, "exactly two writes: profiles then users");
  assert.deepEqual(updateCalls.map((c) => c.collection), ["profiles", "users"]);
});

test("save: exactly the form-owned leaves are written by dotted field path", () => {
  assert.deepEqual([...literalKeys].sort(), [...OWNED_LEAVES].sort());
  for (const key of literalKeys) assert.match(key, /^(basicInfo|professional|profileStatus)\.[a-zA-Z]+$/, `${key} is a dotted leaf`);
  assert.match(updateLiteral, /"profileStatus\.completionPercent":\s*completion/, "completion percentage stays a derived field-path leaf (P1.2)");
});

test("save: hidden siblings are neither reconstructed nor defaulted", () => {
  for (const sibling of HIDDEN_SIBLINGS) {
    assert.ok(!editCode.includes(sibling), `edit-profile.js must not mention ${sibling} (it does not own it)`);
  }
  assert.doesNotMatch(saveHandler, /\bisPublic\b/, "ordinary save never writes profileStatus.isPublic");
  assert.deepEqual(conditionalKeys, ["basicInfo.profilePhoto"], "the only conditional leaf is the photo");
});

// ---------------------------------------------------------------- photo contract
test("photo: written only when this save produced a new cropped photo; deletion stays field-scoped", () => {
  assert.match(saveHandler, /let photoChanged = false;/);
  const uploadBlock = saveHandler.slice(saveHandler.indexOf("if (croppedBlob) {"), saveHandler.indexOf("const profileData"));
  assert.match(uploadBlock, /uploadBytes\(storageRef, croppedBlob\)/);
  assert.match(uploadBlock, /photoChanged = true;/, "photoChanged is set only inside the crop/upload branch");
  assert.equal((saveHandler.match(/photoChanged = true/g) || []).length, 1);
  assert.match(saveHandler, /if \(photoChanged\) \{\s*update\["basicInfo\.profilePhoto"\] = photoURL;\s*\}/, "photo leaf added only under the condition");
  assert.ok(!literalKeys.includes("basicInfo.profilePhoto"), "no unconditional photo write (no null/default)");
  assert.doesNotMatch(saveHandler, /profilePhoto"?\s*:\s*null/, "the save never nulls the photo");
  assert.match(deleteHandler, /updateDoc\(doc\(db, "profiles", user\.uid\), \{\s*"basicInfo\.profilePhoto": null\s*\}\)/, "explicit delete is an intentional single-leaf write");
});

// ---------------------------------------------------------------- P1.2 contract survives
test("order: profiles field-path write → users completion → /feed/ is unchanged", () => {
  const profileWrite = saveHandler.indexOf('await updateDoc(doc(db, "profiles", user.uid), update);');
  const completionWrite = saveHandler.indexOf('await updateDoc(doc(db, "users", user.uid)');
  const feedNavigation = saveHandler.indexOf('window.location.href = "/feed/"');
  assert.ok(profileWrite > -1 && completionWrite > profileWrite && feedNavigation > completionWrite);
  assert.match(saveHandler, /profileCompleted: true,\s*updatedAt: serverTimestamp\(\)/);
});

// ---------------------------------------------------------------- active vs dormant writer
test("writer identity: the tested file is the one the live edit page loads; profile.js is dormant", () => {
  assert.match(EDIT_HTML, /<body data-page="profile-edit">/);
  assert.match(EDIT_HTML, /<script type="module" src="\/profile\/edit\/edit-profile\.js[^"]*"><\/script>/);
  assert.ok(existsSync(path.join(PUBLIC_DIR, "assets", "js", "profile.js")), "dormant writer still exists on disk");
  const loaders = allHtmlFiles(PUBLIC_DIR).filter((f) => {
    const html = readFileSync(f, "utf8");
    return /assets\/js\/profile\.js/.test(html) || /id="profileForm"/.test(html);
  });
  assert.deepEqual(loaders, [], "no page loads profile.js or provides its #profileForm");
  assert.match(code(DORMANT_JS), /profileStatus:\s*\{/, "the dormant file still carries the old whole-map shape, so it must stay unreferenced");
});

// ---------------------------------------------------------------- rules (read-only contract; no change required)
test("rules: field-path leaves stay inside the owner allow-list and hidden siblings remain valid keys", () => {
  assert.match(RULES, /affectedKeys\(\)\s*\.hasOnly\(\['basicInfo', 'professional', 'achievement', 'profileStatus'\]\)/);
  assert.match(RULES, /'fullName', 'headline', 'location', 'profilePhoto',\s*'experienceYears', 'company'/, "basicInfo allow-list includes the hidden siblings");
  assert.match(RULES, /'specialization', 'analyzersWorked', 'plantType',\s*'certifications'/, "professional allow-list includes the hidden siblings");
  assert.match(RULES, /hasOnly\(\['isPublic', 'completionPercent', 'lastUpdated'\]\)/);
  for (const key of OWNED_LEAVES) {
    const [map, leaf] = key.split(".");
    assert.ok(RULES.includes(`'${leaf}'`), `${leaf} of ${map} is an allow-listed key`);
  }
});
