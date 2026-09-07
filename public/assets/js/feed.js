/* =========================================================
   InstMates – Social Technical Feed
   Modern Feed UI + Attachments + Reactions + Comments
========================================================= */

import { db, auth, storage } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  doc,
  updateDoc,
  increment,
  getDoc,
  onSnapshot,
  limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// W0.1: one escaping implementation for the whole site (escapes quotes too)
import { esc, escMultiline, safeStorageUrl } from "./safe-html.js";
// Social + technical composer: pure model (post types, prompts, limits, tags, states)
import {
  POST_TYPES, LIMITS, promptFor, attachmentKind, parseTags, countTags, addTag,
  tagSuggestions, charCount, validateDraft, submitState, submitLabel, SUBMIT_STATES, postBodyHtml
} from "./composer-model.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

/* ================= LOGIN GUARD ================= */

function requireLogin() {
  if (!auth.currentUser) {
    alert("Please login to continue.");
    return false;
  }
  return true;
}

function getDisplayName(profile) {
  if (!profile) return "Technician";
  const basic = profile.basicInfo || {};
  return basic.fullName || profile.fullName || profile.name || profile.displayName || "Technician";
}

/* ================= ELEMENTS ================= */

const feedContainer = document.getElementById("feedContainer");
const postInput = document.getElementById("postInput");
const postBtn = document.getElementById("postBtn");
const postTypeSelect = document.getElementById("postType");
const fileInput = document.getElementById("fileInput");
const postTagsInput = document.getElementById("postTags");

/* ================= STATE ================= */

let selectedCategory = "all";
let usersCache = {};
let unsubscribePosts = null;

/* =========================================================
   CREATE POST
========================================================= */

/* ---------------- Composer UI (DOM) ---------------- */

const composer = {
  submitting: false,
  justPosted: false,
  error: "",
  previewUrl: null
};

const typeButtons = () => [...document.querySelectorAll("#postTypes [data-type]")];
const statusEl = document.getElementById("composerStatus");
const charCountEl = document.getElementById("charCount");
const tagCountEl = document.getElementById("tagCount");
const previewEl = document.getElementById("attachmentPreview");

function currentDraft() {
  return {
    content: postInput ? postInput.value : "",
    file: fileInput?.files?.[0] || null,
    tags: postTagsInput ? postTagsInput.value : "",
    typeId: postTypeSelect?.value || "question",
    signedIn: !!auth.currentUser
  };
}

function setStatus(message, kind) {
  if (!statusEl) return;
  statusEl.textContent = message || "";
  statusEl.className = "composer-status" + (kind ? ` is-${kind}` : "");
}

function refreshComposer() {
  if (!postBtn) return;
  const draft = currentDraft();
  const check = validateDraft({ ...draft, signedIn: true }); // login is asked for on submit, as before
  const state = submitState({ valid: check.ok, submitting: composer.submitting, justPosted: composer.justPosted, error: composer.error });
  postBtn.disabled = state === SUBMIT_STATES.INVALID || state === SUBMIT_STATES.SUBMITTING;
  postBtn.textContent = submitLabel(state);
  postBtn.dataset.state = state;
  if (charCountEl) {
    const n = charCount(draft.content);
    charCountEl.textContent = `${n} / ${LIMITS.content}`;
    charCountEl.classList.toggle("is-limit", n >= LIMITS.content);
  }
  if (tagCountEl) {
    const n = countTags(draft.tags);
    tagCountEl.textContent = `${Math.min(n, LIMITS.tags)}/${LIMITS.tags}`;
    tagCountEl.classList.toggle("is-limit", n > LIMITS.tags);
  }
  if (composer.error) setStatus(composer.error, "error");
  else if (composer.justPosted) setStatus("Posted. Thanks for sharing.", "success");
  else if (!check.ok && (draft.content.trim() || draft.file || countTags(draft.tags) > LIMITS.tags)) setStatus(check.message, "hint");
  else setStatus("", null);
}

function selectType(id) {
  if (!postTypeSelect) return;
  postTypeSelect.value = id;
  for (const btn of typeButtons()) {
    const on = btn.dataset.type === id;
    btn.classList.toggle("is-selected", on);
    btn.setAttribute("aria-checked", on ? "true" : "false");
    btn.tabIndex = on ? 0 : -1;
  }
  if (postInput) postInput.placeholder = promptFor(id);
}

function initTypeChips() {
  const buttons = typeButtons();
  if (!buttons.length) return;
  buttons.forEach((btn, i) => {
    btn.addEventListener("click", () => { selectType(btn.dataset.type); btn.focus(); });
    btn.addEventListener("keydown", (e) => {
      const ids = POST_TYPES.map((t) => t.id);
      let next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = ids[(i + 1) % ids.length];
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = ids[(i - 1 + ids.length) % ids.length];
      if (e.key === " " || e.key === "Enter") next = btn.dataset.type;
      if (!next) return;
      e.preventDefault();
      selectType(next);
      buttons.find((b) => b.dataset.type === next)?.focus();
    });
  });
  selectType(postTypeSelect?.value || POST_TYPES[0].id);
}

function clearPreview() {
  if (composer.previewUrl) { URL.revokeObjectURL(composer.previewUrl); composer.previewUrl = null; }
  if (previewEl) { previewEl.textContent = ""; previewEl.hidden = true; }
}

function renderPreview(file) {
  clearPreview();
  if (!previewEl || !file) return;
  const kind = attachmentKind(file);
  previewEl.hidden = false;
  if (kind === "image") {
    composer.previewUrl = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.src = composer.previewUrl;
    img.alt = "";
    img.className = "attachment-thumb";
    previewEl.appendChild(img);
  }
  const meta = document.createElement("span");
  meta.className = "attachment-meta";
  meta.textContent = `${{ image: "Photo", video: "Video", pdf: "PDF", file: "File" }[kind]} · ${file.name.slice(0, 80)} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  previewEl.appendChild(meta);
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "attachment-remove";
  remove.textContent = "Remove";
  remove.setAttribute("aria-label", "Remove attachment");
  remove.addEventListener("click", () => { if (fileInput) fileInput.value = ""; clearPreview(); refreshComposer(); });
  previewEl.appendChild(remove);
}

function initMediaActions() {
  if (!fileInput) return;
  document.querySelectorAll("[data-media]").forEach((btn) => {
    btn.addEventListener("click", () => {
      fileInput.accept = btn.dataset.accept || "image/*,video/*,application/pdf";
      fileInput.click();
    });
  });
  fileInput.addEventListener("change", () => {
    composer.error = "";
    composer.justPosted = false;
    renderPreview(fileInput.files?.[0] || null);
    refreshComposer();
  });
}

function initTags() {
  const box = document.getElementById("tagSuggestions");
  if (box) {
    for (const s of tagSuggestions()) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tag-suggest";
      chip.textContent = s.tag;
      chip.setAttribute("aria-label", `Add tag ${s.tag}`);
      chip.addEventListener("click", () => {
        if (!postTagsInput) return;
        postTagsInput.value = addTag(postTagsInput.value, s.tag);
        refreshComposer();
      });
      box.appendChild(chip);
    }
  }
  postTagsInput?.addEventListener("input", refreshComposer);
}

async function submitPost() {
  if (composer.submitting) return; // duplicate-submission guard
  const draft = currentDraft();
  const check = validateDraft({ ...draft, signedIn: true });
  if (!check.ok) { composer.error = check.message; refreshComposer(); return; }
  if (!requireLogin()) return;

  composer.submitting = true;
  composer.error = "";
  composer.justPosted = false;
  refreshComposer();

  try {
    const file = draft.file;
    let attachment = null;

    if (file) {
      // Same path, limits and classification the rules and Storage rules expect.
      const filePath = `postAttachments/${auth.currentUser.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      attachment = { url: downloadURL, type: attachmentKind(file), name: file.name };
    }

    await addDoc(collection(db, "posts"), {
      content: draft.content.trim() || "",
      uid: auth.currentUser.uid,
      type: postTypeSelect?.value || "question",
      attachment: attachment || null,
      createdAt: serverTimestamp(),
      editedAt: null,
      reactions: { agree: 0, faced: 0, helpful: 0 },
      votedBy: {},
      tags: parseTags(postTagsInput?.value)
    });

    postInput.value = "";
    if (fileInput) fileInput.value = "";
    if (postTagsInput) postTagsInput.value = "";
    clearPreview();
    composer.justPosted = true;
    setTimeout(() => { composer.justPosted = false; refreshComposer(); }, 4000);
  } catch (err) {
    console.error("Post failed:", err);
    composer.error = "Your post could not be published. Check your connection and try again.";
  } finally {
    composer.submitting = false;
    refreshComposer();
  }
}

if (postBtn) {
  initTypeChips();
  initMediaActions();
  initTags();
  postInput?.addEventListener("input", () => { composer.error = ""; composer.justPosted = false; refreshComposer(); });
  postBtn.addEventListener("click", submitPost);
  refreshComposer();
}

/* =========================================================
   LOAD USERS
========================================================= */

// W0.3/H-11: authors are resolved one document at a time (and cached)
// instead of downloading the entire profiles collection on every load.
// A private or missing profile simply falls back to "Technician".
async function loadUsersFor(uids) {
  const pending = [...new Set(uids)].filter(uid => uid && !(uid in usersCache));
  await Promise.all(pending.map(async uid => {
    try {
      const snap = await getDoc(doc(db, "profiles", uid));
      usersCache[uid] = snap.exists() ? snap.data() : null;
    } catch (err) {
      usersCache[uid] = null;
    }
  }));
}

/* =========================================================
   REAL-TIME POSTS
========================================================= */

function listenPosts() {

  if (unsubscribePosts) unsubscribePosts();

  const postsQuery = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  unsubscribePosts = onSnapshot(postsQuery, async snapshot => {

    await loadUsersFor(snapshot.docs.map(d => d.data().uid));

    feedContainer.innerHTML = "";

    if (snapshot.empty) {
      feedContainer.innerHTML = `
        <div class="card muted" style="text-align:center;padding:28px;">
          No posts yet. Be the first to share a field experience.
        </div>
      `;
      return;
    }

    snapshot.forEach(docSnap => {

      const post = docSnap.data();
      post.id = docSnap.id;

      if (selectedCategory !== "all" &&
          post.type !== selectedCategory) return;

      const card = createPostCard(post);
      feedContainer.appendChild(card);
    });
  });
}

/* =========================================================
   CREATE MODERN POST CARD
========================================================= */

function createPostCard(post) {

  const card = document.createElement("div");
  card.className = "card feed-card modern-feed-card";

  const user = auth.currentUser;
  const isOwner = user && user.uid === post.uid;

  const profile = usersCache[post.uid] || {};
  const userName = getDisplayName(profile);

  const initials = getInitials(userName);

  // Defensive numeric coercion: reaction counters are rendered into markup.
  const agree = num(post.reactions?.agree);
  const faced = num(post.reactions?.faced);
  const helpful = num(post.reactions?.helpful);
  const totalVotes = agree + faced + helpful;

  const hasVoted =
    user && post.votedBy && post.votedBy[user.uid];

  const postType = post.type || "question";
  const badgeLabel = getTypeLabel(postType);
  const badgeClass = getTypeClass(postType);

  let attachmentHTML = "";

  if (post.attachment) {

    // Only Firebase Storage URLs are ever rendered as src/href.
    const safeUrl = esc(safeStorageUrl(post.attachment.url, ""));
    const safeName = esc(String(post.attachment.name || "Attachment").slice(0, 120));

    if (!safeUrl) {
      attachmentHTML = "";
    }
    else if (post.attachment.type === "image") {
      attachmentHTML = `
        <div class="feed-attachment">
          <img src="${safeUrl}" class="feed-image" alt="Post attachment">
        </div>
      `;
    }

    else if (post.attachment.type === "video") {
      attachmentHTML = `
        <div class="feed-attachment">
          <video controls class="feed-video">
            <source src="${safeUrl}">
          </video>
        </div>
      `;
    }

    else if (post.attachment.type === "pdf") {
      attachmentHTML = `
        <div class="pdf-box">
          <span>📄</span>
          <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">
            ${safeName}
          </a>
        </div>
      `;
    }
  }

      let tagsHTML = "";
      if (Array.isArray(post.tags) && post.tags.length > 0) {
        tagsHTML = `<div class="feed-tags">${post.tags.filter(t => typeof t === "string").slice(0, 5).map(t => `<span class="feed-tag">#${esc(t.slice(0, 40))}</span>`).join("")}</div>`;
      }

  card.innerHTML = `
    <div class="feed-top">
      <div class="feed-user">
        <div class="avatar">${esc(initials)}</div>

        <div>
          <div class="feed-username">${esc(userName)}</div>
          <div class="feed-time">
            ${formatTime(post.createdAt?.toDate?.() || new Date())}
            ${post.editedAt ? " · edited" : ""}
          </div>
        </div>
      </div>

      <span class="feed-badge ${badgeClass}">
        ${badgeLabel}
      </span>
    </div>

    ${postBodyHtml(post.content)}

      ${tagsHTML}

    ${attachmentHTML}

    <div class="reaction-summary">
      <span>🔥 ${totalVotes} Technical Reactions</span>
    </div>

    <div class="feed-actions modern-actions">
      <button class="react action-btn" data-type="agree" ${hasVoted ? "disabled" : ""}>
        👍 Agree <span>${agree}</span>
      </button>

      <button class="react action-btn" data-type="faced" ${hasVoted ? "disabled" : ""}>
        🛠 Faced This <span>${faced}</span>
      </button>

      <button class="react action-btn" data-type="helpful" ${hasVoted ? "disabled" : ""}>
        💡 Helpful <span>${helpful}</span>
      </button>

      <button class="toggle-comments action-btn">
        💬 Comments
      </button>
    </div>

    <div class="comments-section" style="display:none;">
      <div class="comments-list"></div>

      <div class="comment-box">
        <input type="text"
               class="comment-input"
               placeholder="Write a technical comment..." />

        <button class="comment-btn">
          Post
        </button>
      </div>
    </div>

    ${isOwner ? `
      <div class="owner-actions">
        <button class="edit-btn">✏ Edit</button>
      </div>
    ` : ""}
  `;

  /* ================= REACTIONS ================= */

  card.querySelectorAll(".react").forEach(btn => {

    btn.addEventListener("click", async () => {

      if (!requireLogin()) return;

      const type = btn.dataset.type;
      const postRef = doc(db, "posts", post.id);

      await updateDoc(postRef, {
        [`reactions.${type}`]: increment(1),
        [`votedBy.${auth.currentUser.uid}`]: true
      });
    });
  });

  /* ================= EDIT / DELETE ================= */

  if (isOwner) {

    card.querySelector(".edit-btn").addEventListener("click", async () => {

      const newContent = prompt("Edit post:", post.content);

      if (!newContent) return;

      await updateDoc(doc(db, "posts", post.id), {
        content: newContent.trim(),
        editedAt: serverTimestamp()
      });
    });

  }

  /* ================= COMMENTS ================= */

  const commentsSection = card.querySelector(".comments-section");
  const toggleBtn = card.querySelector(".toggle-comments");
  const commentsList = card.querySelector(".comments-list");
  const commentBtn = card.querySelector(".comment-btn");
  const commentInput = card.querySelector(".comment-input");

  let unsubscribeComments = null;

  toggleBtn.addEventListener("click", () => {

    const isHidden = commentsSection.style.display === "none";
    commentsSection.style.display = isHidden ? "block" : "none";

    if (isHidden && !unsubscribeComments) {

      const commentsQuery = query(
        collection(db, "posts", post.id, "comments"),
        orderBy("createdAt", "asc")
      );

      unsubscribeComments = onSnapshot(commentsQuery, snapshot => {

        commentsList.innerHTML = "";

        if (snapshot.empty) {
          commentsList.innerHTML = `
            <div class="muted small" style="padding:8px 0;">
              No comments yet.
            </div>
          `;
          return;
        }

        snapshot.forEach(docSnap => {

          const comment = docSnap.data();

          const commentUser = getDisplayName(usersCache[comment.uid]);

          const commentDiv = document.createElement("div");
          commentDiv.className = "comment-item";

          commentDiv.innerHTML = `
            <strong>${esc(commentUser)}</strong>
            <div>${esc(comment.content)}</div>
            <small class="muted">
              ${formatTime(comment.createdAt?.toDate?.() || new Date())}
            </small>
          `;

          commentsList.appendChild(commentDiv);
        });
      });
    }
  });

  commentBtn.addEventListener("click", async () => {

    const content = commentInput.value.trim();

    if (!content) return;
  if (!requireLogin()) return;

    await addDoc(
      collection(db, "posts", post.id, "comments"),
      {
        content,
        uid: auth.currentUser.uid,
        createdAt: serverTimestamp()
      }
    );

    commentInput.value = "";
  });

  commentInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      commentBtn.click();
    }
  });

  return card;
}

/* =========================================================
   INIT
========================================================= */

(async () => {
       listenPosts();
})();

/* =========================================================
   HELPERS
========================================================= */

function formatTime(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m ago";

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";

  const days = Math.floor(hours / 24);
  if (days < 7) return days + "d ago";

  return date.toLocaleDateString();
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getInitials(name) {
  return String(name)
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(part => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "T";
}

function getTypeLabel(type) {
  const labels = {
    question: "❓ Question",
    fault: "🔴 Fault",
    solution: "✅ Solution",
    calibration: "📊 Calibration"
  };

  return labels[type] || "❓ Question";
}

function getTypeClass(type) {
  const classes = {
    question: "badge-question",
    fault: "badge-fault",
    solution: "badge-solution",
    calibration: "badge-calibration"
  };

  return classes[type] || "badge-question";
}

// formatPostContent moved to composer-model.js (postBodyHtml).


// parseTags moved to composer-model.js (same behaviour: comma-split, trimmed, max 5).
