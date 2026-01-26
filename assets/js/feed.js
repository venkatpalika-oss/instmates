/* =========================================================
   InstMates – Feed Logic (PHASE 3 – LIKES + COMMENTS)
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

/* ================= ELEMENTS ================= */

const feedEl   = document.getElementById("feedList");
const form     = document.getElementById("postForm");
const textarea = document.getElementById("postContent");
const statusEl = document.getElementById("postStatus");

/* ================= AUTH ================= */

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!user) return;
  loadFeed();
});

/* ================= LOAD FEED ================= */

async function loadFeed() {
  if (!feedEl) return;

  feedEl.innerHTML = `<p class="muted">Loading feed…</p>`;

  try {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      feedEl.innerHTML = `
        <p class="muted">
          No posts yet. Be the first to share a field experience.
        </p>`;
      return;
    }

    feedEl.innerHTML = "";
    snap.forEach(docSnap => {
      feedEl.appendChild(
        renderPost(docSnap.id, docSnap.data())
      );
    });

  } catch (err) {
    console.error("Feed load error:", err);
    feedEl.innerHTML = `<p class="muted">Failed to load feed.</p>`;
  }
}

/* ================= CREATE POST ================= */

if (form && textarea) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) return;
    const content = textarea.value.trim();
    const btn = form.querySelector("button");
    if (!content) return;

    btn.disabled = true;
    btn.textContent = "Posting…";

    try {
      const profileSnap = await getDoc(
        doc(db, "profiles", currentUser.uid)
      );

      if (!profileSnap.exists()) {
        alert("Complete your profile before posting.");
        return;
      }

      const profile = profileSnap.data();

      await addDoc(collection(db, "posts"), {
        uid: currentUser.uid,
        authorName: profile.fullName,
        authorRole: profile.role,
        content,
        likes: 0,
        likedBy: {},
        createdAt: serverTimestamp()
      });

      textarea.value = "";
      loadFeed();

      if (statusEl) {
        statusEl.textContent = "Posted successfully ✓";
        statusEl.style.display = "block";
        setTimeout(() => statusEl.style.display = "none", 2000);
      }

    } catch (err) {
      console.error("Post creation failed:", err);
      alert("Failed to post. Please try again.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Post";
    }
  });
}

/* ================= RENDER POST ================= */

function renderPost(postId, p) {
  const card = document.createElement("div");
  card.className = "post-card";

  const liked =
    currentUser &&
    p.likedBy &&
    p.likedBy[currentUser.uid] === true;

  const likeCount = p.likes || 0;

  card.innerHTML = `
    <div class="post-header">
      <div class="avatar small"></div>
      <div>
        <strong>${escape(p.authorName || "Unknown")}</strong><br>
        <span class="muted">
          ${escape(p.authorRole || "")}
          · ${timeAgo(p.createdAt)}
        </span>
      </div>
    </div>

    <p>${escape(p.content || "")}</p>

    <div class="post-actions muted">
      <button class="like-btn ${liked ? "liked" : ""}" data-id="${postId}">
        ❤️ ${likeCount}
      </button>
      &nbsp;
      <button class="comment-toggle" data-id="${postId}">
        💬 Comment
      </button>
    </div>

    <div class="comments" id="comments-${postId}" style="display:none;">
      <div class="comment-list"></div>

      <form class="comment-form">
        <input type="text"
               placeholder="Write a comment…"
               required>
        <button type="submit">Post</button>
      </form>
    </div>
  `;

  // Like handler
  card.querySelector(".like-btn")
    .addEventListener("click", () => toggleLike(postId, p));

  // Comment toggle
  card.querySelector(".comment-toggle")
    .addEventListener("click", () => toggleComments(postId));

  // Comment submit
  card.querySelector(".comment-form")
    .addEventListener("submit", (e) =>
      submitComment(e, postId)
    );

  return card;
}

/* ================= LIKES ================= */

async function toggleLike(postId, postData) {
  if (!currentUser) return;

  const ref = doc(db, "posts", postId);
  const likedBy = { ...(postData.likedBy || {}) };
  let likes = postData.likes || 0;

  if (likedBy[currentUser.uid]) {
    delete likedBy[currentUser.uid];
    likes = Math.max(0, likes - 1);
  } else {
    likedBy[currentUser.uid] = true;
    likes += 1;
  }

  await updateDoc(ref, { likedBy, likes });
  loadFeed();
}

/* ================= COMMENTS ================= */

async function toggleComments(postId) {
  const box = document.getElementById(`comments-${postId}`);
  if (!box) return;

  box.style.display =
    box.style.display === "none" ? "block" : "none";

  if (box.style.display === "block") {
    loadComments(postId);
  }
}

async function loadComments(postId) {
  const list =
    document.querySelector(`#comments-${postId} .comment-list`);
  if (!list) return;

  list.innerHTML = `<p class="muted">Loading comments…</p>`;

  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );

  const snap = await getDocs(q);
  list.innerHTML = "";

  snap.forEach(d => {
    const c = d.data();
    const div = document.createElement("div");
    div.className = "comment";
    div.innerHTML = `
      <strong>${escape(c.authorName)}</strong>:
      ${escape(c.content)}
    `;
    list.appendChild(div);
  });
}

async function submitComment(e, postId) {
  e.preventDefault();
  if (!currentUser) return;

  const input = e.target.querySelector("input");
  const content = input.value.trim();
  if (!content) return;

  const profileSnap = await getDoc(
    doc(db, "profiles", currentUser.uid)
  );

  const profile = profileSnap.data();

  await addDoc(
    collection(db, "posts", postId, "comments"),
    {
      uid: currentUser.uid,
      authorName: profile.fullName,
      content,
      createdAt: serverTimestamp()
    }
  );

  input.value = "";
  loadComments(postId);
}

/* ================= HELPERS ================= */

function escape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function timeAgo(ts) {
  if (!ts || !ts.toDate) return "Just now";

  const seconds =
    Math.floor((Date.now() - ts.toDate().getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;

  return `${Math.floor(seconds / 86400)} days ago`;
}
