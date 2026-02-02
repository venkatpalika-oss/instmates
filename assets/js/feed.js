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

/* ================= KNOWLEDGE → FEED PREFILL ================= */

function prefillFromKnowledge() {
  if (!postInput) return;

  const params = new URLSearchParams(window.location.search);
  const title = params.get("title");
  if (!title) return;

  postInput.value =
`Knowledge topic: ${title}

What was your real field experience, fault, or solution related to this?`;

  postInput.focus();
}

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (postInput && postBtn) {
    if (user) {
      postInput.disabled = false;
      postBtn.disabled = false;
      postInput.placeholder =
        "What problem are you facing in the field today?\nExample: 4–20 mA stuck at 4 mA after shutdown";
      postBtn.textContent = "Post";
    } else {
      postInput.disabled = true;
      postBtn.disabled = true;
      postInput.placeholder = "Login to post in the community feed";
      postBtn.textContent = "Login to Post";
    }
  }

  if (user) {
    loadFeed();
    prefillFromKnowledge();
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

/* ================= CREATE POST ================= */

if (postBtn) {
  postBtn.onclick = async () => {
    if (!currentUser) return;

    const content = postInput.value.trim();
    if (!content) return;

    const profile = await getProfile(currentUser.uid);

    await addDoc(collection(db, "posts"), {
      uid: currentUser.uid,
      authorName: profile?.fullName || "User",
      content,
      likes: 0,
      likedBy: {},
      createdAt: serverTimestamp()
    });

    postInput.value = "";
    showPostSuccess();
    loadFeed();
  };
}

/* ================= PROFILE FETCH ================= */

async function getProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "profiles", uid));
    return snap.exists() ? snap.data() : {};
  } catch {
    return {};
  }
}

function renderBadges(badges = []) {
  if (!badges.length) return "";
  return `
    <div class="muted" style="font-size:12px;margin-top:2px">
      ${badges.map(b => `🏷️ ${b}`).join(" · ")}
    </div>
  `;
}

/* ================= RENDER POST ================= */

function renderPost(postId, p, profile) {
  const div = document.createElement("div");
  div.className = "post-card";

  const liked = currentUser ? hasLiked(p, currentUser.uid) : false;

  div.innerHTML = `
    <div class="post-header">
      <strong>
        <a href="/profile-view.html?uid=${p.uid}">
          ${escapeHTML(p.authorName || "Unknown")}
        </a>
      </strong>
      ${renderBadges(profile?.badges)}
      <span class="muted"> · ${timeAgo(p.createdAt)}</span>
    </div>

    <p>${escapeHTML(p.content)}</p>

    <div class="post-reactions-summary">
      👍 ❤️ 👏 <strong class="like-count">${p.likes || 0}</strong>
    </div>

    <div class="post-actions-bar">
      <button class="action-btn ${liked ? "liked" : ""}"
        onclick="toggleLike({ postId:'${postId}', button:this })">
        👍 <span>Like</span>
      </button>

      <button class="action-btn comment-toggle">
        💬 <span>Comment</span>
      </button>

      <button class="action-btn" disabled>🔁 Repost</button>
      <button class="action-btn" disabled>➤ Send</button>
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

  div.querySelectorAll(".comment-toggle").forEach(btn => {
    btn.onclick = async (e) => {
      e.preventDefault();
      commentsBox.style.display =
        commentsBox.style.display === "none" ? "block" : "none";

      if (commentsBox.style.display === "block") {
        await loadComments(postId, list);
      }
    };
  });

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

  for (const d of snap.docs) {
    const c = d.data();
    const profile = await getProfile(c.uid);
    list.appendChild(renderComment(postId, d.id, c, profile));
  }
}

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
      likes: 0,
      likedBy: {},
      createdAt: serverTimestamp()
    }
  );

  input.value = "";
  loadComments(postId, list);
}

/* ================= LIKE HANDLER ================= */

window.toggleLike = async function ({ postId, button }) {
  if (!currentUser) return;

  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const liked = data.likedBy?.[currentUser.uid] === true;

  const newLikes = liked
    ? Math.max((data.likes || 1) - 1, 0)
    : (data.likes || 0) + 1;

  await updateDoc(ref, {
    likes: newLikes,
    [`likedBy.${currentUser.uid}`]: !liked
  });

  // 🔥 RANDOM REACTION
  const reactions = ["👍", "❤️", "👏"];
  const emoji = reactions[Math.floor(Math.random() * reactions.length)];
  showReaction(button, emoji);

  const card = button.closest(".post-card");
  card.querySelector(".like-count").textContent = newLikes;
  button.classList.toggle("liked", !liked);
};

/* ================= REACTION FLOAT ================= */

function showReaction(button, emoji) {
  const bar = button.closest(".post-actions-bar");
  if (!bar) return;

  const span = document.createElement("span");
  span.className = "reaction-float";
  span.textContent = emoji;

  bar.style.position = "relative";
  bar.appendChild(span);

  setTimeout(() => span.remove(), 1200);
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

function hasLiked(post, uid) {
  return !!post.likedBy && post.likedBy[uid] === true;
}
