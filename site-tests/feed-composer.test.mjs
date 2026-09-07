// Feed composer contract tests: /public/assets/js/composer-model.js, /public/feed/index.html, feed.js wiring.
// Run: npm --prefix site-tests test   (no emulator, no network)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { TERMS, normalizeTag } from "../public/assets/js/taxonomy.js";
import {
  LIMITS, POST_TYPES, UNSUPPORTED_POST_TYPES, DEFAULT_PROMPT, MEDIA_ACTIONS, postType, promptFor,
  attachmentKind, parseTags, countTags, addTag, tagSuggestions, charCount, validateDraft,
  SUBMIT_STATES, submitState, submitLabel, postBodyHtml
} from "../public/assets/js/composer-model.js";

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const FEED_HTML = readFileSync(path.join(PUBLIC_DIR, "feed", "index.html"), "utf8");
const FEED_JS = readFileSync(path.join(PUBLIC_DIR, "assets", "js", "feed.js"), "utf8");
const RULES = readFileSync(path.resolve(PUBLIC_DIR, "..", "firestore.rules"), "utf8");
const composerHtml = FEED_HTML.match(/<section class="panel composer"[\s\S]*?<\/section>/)[0];

const file = (type, size = 1024, name = "f") => ({ type, size, name });

// ---------------------------------------------------------------- post types
test("post types: exactly the types firestore.rules accepts; unsupported types are documented, not rendered", () => {
  const rulesTypes = RULES.match(/incoming\(\)\.type in \[([^\]]+)\]/)[1].match(/'([^']+)'/g).map((s) => s.replace(/'/g, "")).sort();
  assert.deepEqual(POST_TYPES.map((t) => t.id).sort(), rulesTypes);
  for (const t of POST_TYPES) {
    assert.ok(t.label && t.hint && t.prompt && t.badge, `${t.id} needs label, hint, prompt and badge`);
    assert.ok(composerHtml.includes(`data-type="${t.id}"`), `chip missing for ${t.id}`);
    assert.ok(composerHtml.includes(`<span class="type-hint">${t.hint}</span>`), `hint missing for ${t.id}`);
  }
  for (const u of UNSUPPORTED_POST_TYPES) {
    assert.ok(!rulesTypes.includes(u.id), `${u.id} is unexpectedly allowed by rules`);
    assert.ok(!composerHtml.includes(`data-type="${u.id}"`), `${u.label} must not be offered while rules reject it`);
    assert.match(u.blockedBy, /firestore\.rules/);
  }
  assert.deepEqual([...composerHtml.matchAll(/data-type="([^"]+)"/g)].map((m) => m[1]), POST_TYPES.map((t) => t.id));
  assert.equal(postType("general"), null);
});

test("post types: chips are an accessible radiogroup with an obvious selected state, hidden #postType carries the value", () => {
  assert.ok(/<div class="composer-types" role="radiogroup" aria-label="Post type" id="postTypes">/.test(composerHtml));
  assert.equal((composerHtml.match(/role="radio"/g) || []).length, POST_TYPES.length);
  assert.equal((composerHtml.match(/aria-checked="true"/g) || []).length, 1, "exactly one type pre-selected");
  assert.ok(composerHtml.includes('<input type="hidden" id="postType" value="question">'));
  assert.ok(FEED_HTML.includes(".type-chip.is-selected") && FEED_HTML.includes('.type-chip.is-selected .type-name::after { content:" ✓"'), "selected state must not rely on colour alone");
  assert.ok(FEED_HTML.includes(".type-chip:focus-visible"), "visible focus for chips");
  assert.ok(/ArrowRight|ArrowLeft/.test(FEED_JS) && /aria-checked/.test(FEED_JS), "keyboard selection wired in feed.js");
});

test("prompts: contextual placeholder per type; default social prompt in the HTML", () => {
  assert.equal(promptFor("question"), "What are you trying to troubleshoot?");
  assert.equal(promptFor("fault"), "What happened? Share symptoms, readings and observations.");
  assert.equal(promptFor("solution"), "What fixed the problem?");
  assert.equal(promptFor("calibration"), "Share the calibration method, issue or lesson.");
  assert.equal(promptFor("nope"), DEFAULT_PROMPT);
  assert.ok(composerHtml.includes(`placeholder="${DEFAULT_PROMPT}"`));
  assert.ok(/<label for="postInput"/.test(composerHtml), "textarea has a label");
  assert.ok(/maxlength="1000"/.test(composerHtml));
});

// ---------------------------------------------------------------- drafts
test("draft validation: text-only, image-only, text+image, video, PDF are valid; empty, over-limit and unauthenticated are not", () => {
  assert.equal(validateDraft({ content: "Loop reads 3.2 mA" }).ok, true);
  assert.equal(validateDraft({ content: "", file: file("image/png") }).ok, true, "image-only");
  assert.equal(validateDraft({ content: "see photo", file: file("image/jpeg") }).ok, true);
  assert.equal(validateDraft({ content: "", file: file("video/mp4") }).ok, true);
  assert.equal(validateDraft({ content: "", file: file("application/pdf") }).ok, true);
  assert.deepEqual(validateDraft({ content: "   " }).reason, "empty");
  assert.equal(validateDraft({ content: "x".repeat(LIMITS.content) }).ok, true, "1000 characters is allowed");
  assert.equal(validateDraft({ content: "x".repeat(LIMITS.content + 1) }).reason, "length", "1001 characters is rejected");
  assert.equal(validateDraft({ content: "x", file: file("image/png", LIMITS.fileBytes + 1) }).reason, "file");
  assert.equal(validateDraft({ content: "x", file: file("image/png", LIMITS.fileBytes) }).ok, true);
  assert.equal(validateDraft({ content: "x", tags: "a,b,c,d,e,f" }).reason, "tags");
  assert.equal(validateDraft({ content: "x", tags: "a,b,c,d,e" }).ok, true);
  assert.equal(validateDraft({ content: "x", signedIn: false }).reason, "login");
  assert.equal(validateDraft({ content: "x", typeId: "general" }).reason, "type");
  assert.equal(charCount("héllo"), 5);
});

test("attachments: classification matches what the rules accept; media actions map to the single file input", () => {
  assert.equal(attachmentKind(file("image/webp")), "image");
  assert.equal(attachmentKind(file("video/webm")), "video");
  assert.equal(attachmentKind(file("application/pdf")), "pdf");
  assert.equal(attachmentKind(file("text/html")), "file");
  assert.equal(attachmentKind(null), "file");
  const rulesKinds = RULES.match(/a\.type in \[([^\]]+)\]/)[1].match(/'([^']+)'/g).map((s) => s.replace(/'/g, ""));
  for (const m of MEDIA_ACTIONS) {
    assert.ok(rulesKinds.includes(m.id), `media action ${m.id} not accepted by rules`);
    assert.ok(composerHtml.includes(`data-media="${m.id}" data-accept="${m.accept}"`), `media button missing for ${m.id}`);
  }
  assert.equal((composerHtml.match(/type="file"/g) || []).length, 1, "one file input, as before");
  assert.ok(composerHtml.includes('accept="image/*,video/*,application/pdf"'));
  assert.doesNotMatch(composerHtml, /poll|feeling|location|data-media="link"/i, "FUTURE mockup controls must not appear");
  assert.ok(FEED_JS.includes('previewEl') && FEED_JS.includes('aria-label", "Remove attachment"'), "preview with a remove action");
  assert.ok(FEED_JS.includes("URL.revokeObjectURL"), "image preview object URLs are released");
});

test("tags: free text preserved, max 5, no duplicates, suggestions come from the canonical taxonomy only", () => {
  assert.deepEqual(parseTags(" gc , , FID,4-20mA "), ["gc", "FID", "4-20mA"]);
  assert.deepEqual(parseTags("1,2,3,4,5,6,7"), ["1", "2", "3", "4", "5", "6", "7"].slice(0, LIMITS.tags));
  assert.equal(countTags("a, b,,c"), 3);
  assert.equal(addTag("gc, fid", "GC"), "gc, fid", "case-insensitive de-duplication");
  assert.equal(addTag("", "Pressure"), "Pressure");
  assert.equal(addTag("gc", "4-20mA"), "gc, 4-20mA");
  const suggestions = tagSuggestions();
  assert.ok(suggestions.length >= 8);
  for (const s of suggestions) {
    assert.equal(normalizeTag(s.tag), s.slug, `suggestion "${s.tag}" must normalise to its own term`);
    assert.equal(TERMS.find((t) => t.slug === s.slug).coverage, "supported");
  }
  const tags = suggestions.map((s) => s.tag);
  for (const expected of ["GC", "FTIR", "4-20MA", "Calibration", "Flow", "Pressure", "Troubleshooting"]) {
    assert.ok(tags.some((t) => t.toLowerCase() === expected.toLowerCase()), `expected suggestion ${expected}`);
  }
  assert.ok(composerHtml.includes('id="tagSuggestions"') && composerHtml.includes('id="tagCount"'));
  assert.doesNotMatch(FEED_JS, /\["gc",\s*"ftir"/i, "no hard-coded tag list in feed.js");
});

test("submission: states, labels, duplicate-submission guard, error and unauthenticated handling in feed.js", () => {
  assert.equal(submitState({ valid: false }), SUBMIT_STATES.INVALID);
  assert.equal(submitState({ valid: true }), SUBMIT_STATES.READY);
  assert.equal(submitState({ valid: true, submitting: true }), SUBMIT_STATES.SUBMITTING);
  assert.equal(submitState({ valid: true, justPosted: true }), SUBMIT_STATES.SUCCESS);
  assert.equal(submitState({ valid: true, error: "x" }), SUBMIT_STATES.ERROR);
  assert.equal(submitState({ valid: true, submitting: true, error: "x" }), SUBMIT_STATES.SUBMITTING, "submitting wins while in flight");
  assert.equal(submitLabel("submitting"), "Posting…");
  assert.equal(submitLabel("ready"), "Post");
  assert.ok(FEED_JS.includes("if (composer.submitting) return; // duplicate-submission guard"));
  assert.ok(FEED_JS.includes("composer.submitting = true;") && FEED_JS.includes("composer.submitting = false;"));
  assert.ok(FEED_JS.includes("if (!requireLogin()) return;"), "unauthenticated users are asked to log in before any write");
  assert.ok(/catch \(err\) \{[\s\S]*?composer\.error = /.test(FEED_JS), "upload/write errors surface in the composer");
  assert.ok(composerHtml.includes('id="composerStatus" class="composer-status" role="status" aria-live="polite"'));
  assert.ok(composerHtml.includes('<button id="postBtn" type="button" class="btn btn-primary composer-post" disabled>Post</button>'));
});

test("write path unchanged: feed.js still writes exactly the nine rule-validated keys and the same storage path", () => {
  const block = FEED_JS.match(/addDoc\(collection\(db, "posts"\), \{([\s\S]*?)\}\);/)[1];
  const keys = [...block.matchAll(/^\s*([a-zA-Z]+):/gm)].map((m) => m[1]).sort();
  assert.deepEqual(keys, ["attachment", "content", "createdAt", "editedAt", "reactions", "tags", "type", "uid", "votedBy"]);
  assert.ok(block.includes("reactions: { agree: 0, faced: 0, helpful: 0 }") && block.includes("votedBy: {}") && block.includes("editedAt: null"));
  assert.ok(FEED_JS.includes("`postAttachments/${auth.currentUser.uid}/${Date.now()}_${file.name}`"));
  assert.ok(FEED_JS.includes("type: attachmentKind(file)"));
  assert.doesNotMatch(FEED_JS, /setDoc\(doc\(db, "posts"|deleteDoc/, "no new write paths");
});

// ---------------------------------------------------------------- feed card
test("feed card: empty body renders nothing, text renders escaped, images keep their full content", () => {
  assert.equal(postBodyHtml(null), "");
  assert.equal(postBodyHtml("   \n "), "", "null/empty body + image → no reserved blank region");
  const html = postBodyHtml("Loop reads <b>3.2 mA</b>\nafter restart");
  assert.ok(html.startsWith('<div class="feed-content modern-content">'));
  assert.ok(html.includes("&lt;b&gt;3.2 mA&lt;/b&gt;"), "HTML is escaped");
  assert.ok(FEED_JS.includes("${postBodyHtml(post.content)}"), "card uses postBodyHtml");
  assert.doesNotMatch(FEED_JS, /<div class="feed-content modern-content">\s*\$\{/, "no unconditional body container");
  const css = FEED_HTML.match(/\.feed-image\{[\s\S]*?\}/)[0];
  assert.ok(css.includes("object-fit:contain") && css.includes("height:auto") && css.includes("max-width:100%"), "technical landscape images are not cropped");
  assert.doesNotMatch(css, /object-fit:cover/);
  const content = FEED_HTML.match(/\.modern-content\{[\s\S]*?\}/)[0];
  assert.doesNotMatch(content, /min-height/, "no reserved body height");
  assert.ok(FEED_HTML.includes(".feed-card .feed-image,"), "feed image rule must outrank the sitewide .card img crop");
});

test("mobile: composer stays usable at <=768px despite the legacy sitewide hide rule; preview honours [hidden]", () => {
  const mobile = FEED_HTML.match(/@media \(max-width: 768px\) \{[\s\S]*?\.composer #postBtn[\s\S]*?\}/);
  assert.ok(mobile, "mobile override block missing");
  assert.ok(mobile[0].includes(".composer #postInput, .composer #postTags { display:block; }"));
  assert.ok(mobile[0].includes(".composer #postBtn { display:inline-flex;"));
  assert.ok(FEED_HTML.includes(".attachment-preview[hidden] { display:none; }"));
  assert.ok(FEED_HTML.includes(".tag-suggestions { flex-wrap:nowrap; overflow-x:auto;"), "suggestions become one scrollable row on mobile");
});

test("social scope: no fake social features, technical reactions preserved", () => {
  assert.doesNotMatch(FEED_HTML, /followers|online now|trending|\blikes?\b|class="[^"]*stor(y|ies)/i);
  for (const t of TERMS.filter((x) => x.tag)) {
    assert.equal(normalizeTag(t.tag), t.slug, `taxonomy tag "${t.tag}" must be the label or an approved alias of ${t.slug}`);
  }
  for (const r of ['data-type="agree"', 'data-type="faced"', 'data-type="helpful"']) assert.ok(FEED_JS.includes(r), `reaction ${r} preserved`);
  assert.ok(FEED_JS.includes('class="toggle-comments action-btn"'), "comments preserved");
});
