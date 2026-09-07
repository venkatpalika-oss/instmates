/* =========================================================
   InstMates – Feed composer model (pure, testable)
   File: /assets/js/composer-model.js

   Pure data and functions behind the social + technical composer on
   /feed/. No DOM, no Firebase. feed.js owns the DOM and the write
   path; nothing here changes the post document shape, which stays
   exactly what firestore.rules validates:
     content, uid, type, attachment, createdAt, editedAt, reactions,
     votedBy, tags
========================================================= */

import { TERMS, COVERAGE, normalizeTag } from "./taxonomy.js";
import { escMultiline } from "./safe-html.js";

/** Limits enforced by the UI (rules allow content ≤ 5000; the site keeps 1000). */
export const LIMITS = Object.freeze({ content: 1000, tags: 5, fileBytes: 20 * 1024 * 1024 });

/**
 * Post types accepted by firestore.rules today
 * (`type in ['question','fault','solution','calibration']`).
 */
export const POST_TYPES = Object.freeze([
  Object.freeze({ id: "question", label: "Question", hint: "Need help?", icon: "❓", badge: "badge-question",
    prompt: "What are you trying to troubleshoot?" }),
  Object.freeze({ id: "fault", label: "Fault Report", hint: "Report an issue", icon: "🔴", badge: "badge-fault",
    prompt: "What happened? Share symptoms, readings and observations." }),
  Object.freeze({ id: "solution", label: "Solution", hint: "Share a fix", icon: "✅", badge: "badge-solution",
    prompt: "What fixed the problem?" }),
  Object.freeze({ id: "calibration", label: "Calibration", hint: "Share calibration experience", icon: "📊", badge: "badge-calibration",
    prompt: "Share the calibration method, issue or lesson." })
]);

/**
 * Desired types that the current rules contract rejects. They are NOT
 * rendered: adding them needs a rules/schema decision (`type` allow-list).
 */
export const UNSUPPORTED_POST_TYPES = Object.freeze([
  Object.freeze({ id: "case-study", label: "Case Study", blockedBy: "firestore.rules posts.create type allow-list" }),
  Object.freeze({ id: "knowledge", label: "Knowledge", blockedBy: "firestore.rules posts.create type allow-list" }),
  Object.freeze({ id: "general", label: "General", blockedBy: "firestore.rules posts.create type allow-list" })
]);

export const DEFAULT_PROMPT = "What's on your mind? Share your question, field experience, photo or idea…";

export function postType(id) {
  return POST_TYPES.find((t) => t.id === id) || null;
}

export function promptFor(id) {
  const t = postType(id);
  return t ? t.prompt : DEFAULT_PROMPT;
}

/** Media actions map to the existing single file input (accept + attachment.type). */
export const MEDIA_ACTIONS = Object.freeze([
  Object.freeze({ id: "image", label: "Photo", accept: "image/*", icon: "📷" }),
  Object.freeze({ id: "video", label: "Video", accept: "video/*", icon: "🎬" }),
  Object.freeze({ id: "pdf", label: "PDF", accept: "application/pdf", icon: "📄" })
]);

/** Same classification feed.js has always written into attachment.type. */
export function attachmentKind(file) {
  if (!file || typeof file.type !== "string") return "file";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  return "file";
}

/** Existing behaviour: comma-separated, trimmed, empty dropped, at most 5. */
export function parseTags(str) {
  return String(str || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, LIMITS.tags);
}

/** Number of tags the user typed before the cap (for the "n/5" indicator and the over-limit warning). */
export function countTags(str) {
  return String(str || "").split(",").map((t) => t.trim()).filter(Boolean).length;
}

/** Append a tag to a comma-separated value without duplicating it; returns the new value. */
export function addTag(str, tag) {
  const existing = String(str || "").split(",").map((t) => t.trim()).filter(Boolean);
  const wanted = String(tag || "").trim();
  if (!wanted) return existing.join(", ");
  if (existing.some((t) => t.toLowerCase() === wanted.toLowerCase())) return existing.join(", ");
  return [...existing, wanted].join(", ");
}

/**
 * Quick tag suggestions from the canonical taxonomy: supported terms only,
 * each rendered as the term's declared `tag` (label or approved alias).
 * Every suggestion normalises back to its own term (tested), so no second
 * vocabulary exists.
 */
export function tagSuggestions() {
  return TERMS
    .filter((t) => t.coverage === COVERAGE.SUPPORTED && t.tag)
    .map((t) => ({ slug: t.slug, tag: t.tag }))
    .filter((s) => normalizeTag(s.tag) === s.slug);
}

/** Text length as the browser's maxlength counts it (UTF-16 code units). */
export function charCount(text) {
  return String(text || "").length;
}

/**
 * Whether a draft can be posted. Mirrors what feed.js has always
 * required (text or a file) plus the UI limits; the rules still decide.
 */
export function validateDraft({ content = "", file = null, tags = "", typeId = "question", signedIn = true } = {}) {
  const text = String(content || "").trim();
  if (!signedIn) return { ok: false, reason: "login", message: "Log in to post." };
  if (!postType(typeId)) return { ok: false, reason: "type", message: "Choose a post type." };
  if (!text && !file) return { ok: false, reason: "empty", message: "Write something or add a photo, video or PDF." };
  if (charCount(text) > LIMITS.content) return { ok: false, reason: "length", message: `Keep it under ${LIMITS.content} characters.` };
  if (file && Number.isFinite(file.size) && file.size > LIMITS.fileBytes) return { ok: false, reason: "file", message: "Maximum file size is 20MB." };
  if (countTags(tags) > LIMITS.tags) return { ok: false, reason: "tags", message: `Use at most ${LIMITS.tags} tags.` };
  return { ok: true, reason: null, message: "" };
}

/** Post button states; feed.js maps these onto the button and the status line. */
export const SUBMIT_STATES = Object.freeze({
  INVALID: "invalid", READY: "ready", SUBMITTING: "submitting", SUCCESS: "success", ERROR: "error"
});

export function submitState({ valid, submitting, justPosted, error }) {
  if (submitting) return SUBMIT_STATES.SUBMITTING;
  if (error) return SUBMIT_STATES.ERROR;
  if (justPosted) return SUBMIT_STATES.SUCCESS;
  return valid ? SUBMIT_STATES.READY : SUBMIT_STATES.INVALID;
}

export function submitLabel(state) {
  return { invalid: "Post", ready: "Post", submitting: "Posting…", success: "Posted ✓", error: "Try again" }[state] || "Post";
}

/**
 * Post body markup. Empty or whitespace-only content renders NOTHING,
 * so a photo-only post is AUTHOR → ATTACHMENT → REACTIONS with no
 * reserved blank region (feed-card blank-space fix).
 */
export function postBodyHtml(content) {
  const text = String(content || "").trim();
  if (!text) return "";
  return `<div class="feed-content modern-content">${escMultiline(text.slice(0, 5000))}</div>`;
}
