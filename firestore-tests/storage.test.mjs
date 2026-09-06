// Cloud Storage Security Rules tests for the InstMates website (W0.5).
// Emulator only – see rules.test.mjs header for the run command.
import { test, before, after, beforeEach, describe } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { ref, uploadBytes, getBytes, deleteObject, getMetadata } from "firebase/storage";

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT = "demo-instmates-web";
const BUCKET = "demo-instmates-web.appspot.com";
const A = "user_a";
const B = "user_b";

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    storage: {
      rules: readFileSync(join(here, "..", "storage.rules"), "utf8"),
      storageBucket: BUCKET,
    },
  });
});

after(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const s = ctx.storage(BUCKET);
    await uploadBytes(ref(s, `profilePhotos/${A}`), new Uint8Array([1, 2, 3]), { contentType: "image/jpeg" });
    await uploadBytes(ref(s, `postAttachments/${A}/1_existing.pdf`), new Uint8Array([1, 2, 3]), { contentType: "application/pdf" });
    await uploadBytes(ref(s, `private/secret.txt`), new Uint8Array([1]), { contentType: "text/plain" });
  });
});

const anon = () => env.unauthenticatedContext().storage(BUCKET);
const as = (uid) => env.authenticatedContext(uid).storage(BUCKET);
const png = (bytes = 1024) => new Uint8Array(bytes);

describe("profilePhotos/{uid}", () => {
  test("anyone can read a profile photo", async () => {
    await assertSucceeds(getBytes(ref(anon(), `profilePhotos/${A}`)));
  });
  test("owner can upload a small image", async () => {
    await assertSucceeds(uploadBytes(ref(as(A), `profilePhotos/${A}`), png(), { contentType: "image/png" }));
  });
  test("another member cannot overwrite someone else's photo", async () => {
    await assertFails(uploadBytes(ref(as(B), `profilePhotos/${A}`), png(), { contentType: "image/png" }));
  });
  test("anonymous cannot upload", async () => {
    await assertFails(uploadBytes(ref(anon(), `profilePhotos/${A}`), png(), { contentType: "image/png" }));
  });
  test("non-image content types are rejected", async () => {
    await assertFails(uploadBytes(ref(as(A), `profilePhotos/${A}`), png(), { contentType: "text/html" }));
    await assertFails(uploadBytes(ref(as(A), `profilePhotos/${A}`), png(), { contentType: "image/svg+xml" }));
  });
  test("images over 5 MB are rejected", async () => {
    await assertFails(uploadBytes(ref(as(A), `profilePhotos/${A}`), png(5 * 1024 * 1024 + 1), { contentType: "image/png" }));
  });
  test("owner can delete own photo; others cannot", async () => {
    await assertFails(deleteObject(ref(as(B), `profilePhotos/${A}`)));
    await assertSucceeds(deleteObject(ref(as(A), `profilePhotos/${A}`)));
  });
});

describe("postAttachments/{uid}/{file}", () => {
  test("anyone can read an attachment", async () => {
    await assertSucceeds(getBytes(ref(anon(), `postAttachments/${A}/1_existing.pdf`)));
  });
  test("owner can upload image / video / pdf into own folder", async () => {
    await assertSucceeds(uploadBytes(ref(as(A), `postAttachments/${A}/2_a.png`), png(), { contentType: "image/png" }));
    await assertSucceeds(uploadBytes(ref(as(A), `postAttachments/${A}/3_a.mp4`), png(), { contentType: "video/mp4" }));
    await assertSucceeds(uploadBytes(ref(as(A), `postAttachments/${A}/4_a.pdf`), png(), { contentType: "application/pdf" }));
  });
  test("uploads into another member's folder are rejected", async () => {
    await assertFails(uploadBytes(ref(as(B), `postAttachments/${A}/5_b.png`), png(), { contentType: "image/png" }));
  });
  test("executable / html / oversized uploads are rejected", async () => {
    await assertFails(uploadBytes(ref(as(A), `postAttachments/${A}/6.html`), png(), { contentType: "text/html" }));
    await assertFails(uploadBytes(ref(as(A), `postAttachments/${A}/7.exe`), png(), { contentType: "application/octet-stream" }));
    await assertFails(uploadBytes(ref(as(A), `postAttachments/${A}/8.png`), png(20 * 1024 * 1024 + 1), { contentType: "image/png" }));
  });
  test("attachments are immutable once written", async () => {
    await assertFails(uploadBytes(ref(as(A), `postAttachments/${A}/1_existing.pdf`), png(), { contentType: "application/pdf" }));
    await assertFails(deleteObject(ref(as(A), `postAttachments/${A}/1_existing.pdf`)));
  });
});

describe("everything else", () => {
  test("unknown paths are unreadable and unwritable", async () => {
    await assertFails(getMetadata(ref(anon(), "private/secret.txt")));
    await assertFails(getMetadata(ref(as(A), "private/secret.txt")));
    await assertFails(uploadBytes(ref(as(A), `uploads/${A}/x.png`), png(), { contentType: "image/png" }));
  });
});
