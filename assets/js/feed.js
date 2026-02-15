console.log("PHASE 6 ACTIVE");

/* =========================================================
   InstMates – Feed Logic
   PHASE 6 – PROFESSIONAL FEED SYSTEM
   POSTS + COMMENTS + LIKES + EDIT + DELETE + SORT
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
  deleteDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= STATE ================= */

let currentUser = null;
let currentSort = "latest";

/* ================= ELEMENTS ================= */

const feedEl = document.querySelector(".feed");
const postInput = document.getElementById("postInput");
const postBtn = document.getElementById("postBtn");
const sortSelect = document.getElementById("sortFeed");

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) loadFeed();
});

/* ================= SORT HANDLER ================= */

if (sortSelect) {
  sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    loadFeed();
  });
}

/* ================= LOAD FEED ================= */

async function loadFeed() {
  if (!feedEl) return;

  feedEl.innerHTML = `<p class="muted">Loading feed…</p>`;

  let q;

  if (currentSort === "popular") {
    q = query(
      collection(db, "posts"),
      orderBy("likes", "desc"),
      limit(20)
    );
  } else {
    q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }

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
  div.className = "card feed-card";

  const isOwner = currentUser && currentUser.uid === p.uid;

  div.innerHTML = `
    <div class="feed-header">
      <strong>${escapeHTML(p.authorName || "Technician")}</strong>
      <span class="muted small">${timeAgo(p.createdAt)}</span>
    </div>

    <div class="feed-content">
      ${escapeHTML(p.content)}
    </div>

    <div class="feed-actions">
      <button class="likeBtn" data-id="${postId}">
        👍 <span>${p.likes || 0}</span>
      </button>

      <button class="commentToggle" data-id="${postId}">
        💬 Comment
      </button>

      ${isOwner ? `
        <button class="editBtn" data-id="${postId}">✏️</button>
        <button class="deleteBtn" data-id="${postId}">🗑️</button>
      ` : ""}
    </div>

    <div class="comments hidden" id="comments-${postId}">
      <div class="comment-list"></div>
      <form class="comment-form">
        <input placeholder="Reply with a practical solution…" required />
        <button>Post</button>
      </form>
    </div>
  `;

  attachPostEvents(div, postId, p);

  return div;
}

/* ================= POST EVENTS ================= */

function attachPostEvents(div, postId, postData) {

  const likeBtn = div.querySelector(".likeBtn");
  const commentToggle = div.querySelector(".commentToggle");
  const commentBox = div.querySelector(".comments");
  const commentList = div.querySelector(".comment-list");
  const commentForm = div.querySelector(".comment-form");

/* LIKE */
likeBtn.onclick = async () => {
  if (!currentUser) return;

  const userId = currentUser.uid;
  const postRef = doc(db, "posts", postId);

  try {
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    const postData = postSnap.data();

    // Ensure fields exist (for legacy posts)
    const currentLikes = postData.likes || 0;
    const currentLikedBy = postData.likedBy || {};

    const alreadyLiked = currentLikedBy[userId] === true;

    // Small animation
    likeBtn.style.transform = "scale(1.2)";
    setTimeout(() => {
      likeBtn.style.transform = "scale(1)";
    }, 150);

    if (!alreadyLiked) {

      const updatedLikedBy = {
        ...currentLikedBy,
        [userId]: true
      };

      await updateDoc(postRef, {
        likes: currentLikes + 1,
        likedBy: updatedLikedBy
      });

      const span = likeBtn.querySelector("span");
      span.textContent = currentLikes + 1;
      likeBtn.classList.add("liked");
    }

  } catch (err) {
    console.error("Like failed:", err);
  }
};

   /* COMMENT TOGGLE */
  commentToggle.onclick = async () => {
    commentBox.classList.toggle("hidden");
    if (!commentBox.classList.contains("hidden")) {
      await loadComments(postId, commentList);
    }
  };

  /* COMMENT SUBMIT */
  commentForm.onsubmit = (e) =>
    submitComment(e, postId, commentList);

  /* DELETE */
  const deleteBtn = div.querySelector(".deleteBtn");
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      if (!confirm("Delete this post?")) return;
      await deleteDoc(doc(db, "posts", postId));
      loadFeed();
    };
  }

  /* EDIT */
  const editBtn = div.querySelector(".editBtn");
  if (editBtn) {
    editBtn.onclick = async () => {
      const newContent = prompt("Edit your post:", postData.content);
      if (!newContent) return;

      await updateDoc(doc(db, "posts", postId), {
        content: newContent
      });

      loadFeed();
    };
  }
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
    list.appendChild(renderComment(c));
  }
}

function renderComment(c) {
  const div = document.createElement("div");
  div.className = "comment-item";

  div.innerHTML = `
    <strong>${escapeHTML(c.authorName || "User")}</strong>
    <span class="muted small"> · ${timeAgo(c.createdAt)}</span>
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

  await addDoc(
    collection(db, "posts", postId, "comments"),
    {
      uid: currentUser.uid,
      authorName: currentUser.displayName || "User",
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
