/* =========================================================
   InstMates – Feed Logic
   PHASE 5 – POSTS + COMMENTS + LIKES + REPLIES + BADGES
   File: assets/js/feed.js
========================================================= */

import { auth, db } from "./firebase.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= STATE ================= */

let currentUser = null;

/* ================= ELEMENTS ================= */

const feedEl = document.querySelector(".feed");
const postInput = document.getElementById("postInput");
const postBtn = document.getElementById("postBtn");

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (user) {
    loadFeed();
  }
});

/* ================= LOAD FEED ================= */

async function loadFeed() {
  if (!feedEl) return;

  feedEl.innerHTML = `<p class="muted">Loading feed…</p>`;

  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  const snap = await getDocs(q);
  feedEl.innerHTML = "";

  if (snap.empty) {
    feedEl.innerHTML = `<p class="muted">No posts yet.</p>`;
    return;
  }

  for (const d of snap.docs) {
    const post = d.data();
    const profile = await getProfile(post.uid);
    feedEl.appendChild(renderPost(d.id, post, profile));
  }
}

/* ================= PROFILE ================= */

async function getProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "profiles", uid));
    return snap.exists() ? snap.data() : {};
  } catch {
    return {};
  }
}

/* ================= RENDER POST ================= */

function renderPost(postId, p, profile) {
  const div = document.createElement("div");
  div.className = "post-card";

  div.innerHTML = `
    <div class="post-header">
      <strong>${escapeHTML(p.authorName || "User")}</strong>
      <span class="muted"> · ${timeAgo(p.createdAt)}</span>
    </div>

    <p>${escapeHTML(p.content)}</p>

    <div class="post-actions-bar">
      <button class="action-btn comment-toggle">
        💬 Comment
      </button>
    </div>

    <div class="comments" style="display:none">
      <div class="comment-list"></div>
      <form class="comment-form">
        <input placeholder="Reply with a practical solution…" required />
        <button>Post</button>
      </form>
    </div>
  `;

  const commentsBox = div.querySelector(".comments");
  const list = div.querySelector(".comment-list");

  div.querySelector(".comment-toggle").onclick = async () => {
    commentsBox.style.display =
      commentsBox.style.display === "none" ? "block" : "none";

    if (commentsBox.style.display === "block") {
      await loadComments(postId, list);
    }
  };

  div.querySelector(".comment-form").onsubmit =
    (e) => submitComment(e, postId, list);

  return div;
}

/* ================= COMMENTS ================= */

async function loadComments(postId, list) {
  list.innerHTML = `<p class="muted">Loading comments…</p>`;

  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );

  const snap = await getDocs(q);
  list.innerHTML = "";

  if (snap.empty) {
    list.innerHTML = `<p class="muted">No replies yet.</p>`;
    return;
  }

  for (const d of snap.docs) {
    const c = d.data();
    const profile = await getProfile(c.uid);
    list.appendChild(renderComment(postId, d.id, c, profile));
  }
}

/* ================= RENDER COMMENT (🔥 FIX) ================= */

function renderComment(postId, commentId, c, profile) {
  const div = document.createElement("div");
  div.className = "comment-item";

  div.innerHTML = `
    <div class="comment-header">
      <strong>${escapeHTML(c.authorName || "User")}</strong>
      <span class="muted"> · ${timeAgo(c.createdAt)}</span>
    </div>
    <p>${escapeHTML(c.content)}</p>
  `;

  return div;
}

/* ================= SUBMIT COMMENT ================= */

async function submitComment(e, postId, list) {
  e.preventDefault();
  if (!currentUser) return;

  const input = e.target.querySelector("input");
  const content = input.value.trim();
  if (!content) return;

  const profile = await getProfile(currentUser.uid);

  await addDoc(
    collection(db, "posts", postId, "comments"),
    {
      uid: currentUser.uid,
      authorName: profile?.fullName || "User",
      content,
      createdAt: serverTimestamp()
    }
  );

  input.value = "";
  loadComments(postId, list);
}

/* ================= HELPERS ================= */

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function timeAgo(ts) {
  if (!ts?.toDate) return "Just now";
  const s = Math.floor((Date.now() - ts.toDate()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return `${Math.floor(s / 86400)} days ago`;
}
