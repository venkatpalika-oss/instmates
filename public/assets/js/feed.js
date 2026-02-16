console.log("PHASE 7 PROFESSIONAL SOCIAL ENGINE ACTIVE");

/* =========================================================
   InstMates – Feed Logic
   PROFESSIONAL SOCIAL ENGINE
   POSTS + COMMENTS + LIKES (SCALABLE) + EDIT + DELETE + SORT
========================================================= */

import { auth, db } from "./firebase.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= STATE ================= */

let currentUser = null;
let currentSort = "latest";

/* ================= ELEMENTS ================= */

const feedEl = document.getElementById("feedContainer");
const postInput = document.getElementById("postInput");
const postBtn = document.getElementById("postBtn");
const sortSelect = document.getElementById("sortFeed");

/* ================= AUTH ================= */

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  loadFeed();
});

/* ================= SORT ================= */

if (sortSelect) {
  sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    loadFeed();
  });
}

/* ================= CREATE POST ================= */

if (postBtn) {
  postBtn.addEventListener("click", async () => {
    if (!currentUser) {
      alert("Please login to post.");
      return;
    }

    const content = postInput.value.trim();
    if (!content) return;

    await addDoc(collection(db, "posts"), {
      authorId: currentUser.uid,
      authorName: currentUser.displayName || "Technician",
      content,
      createdAt: serverTimestamp(),
      likesCount: 0,
      commentsCount: 0
    });

    postInput.value = "";
  });
}

/* ================= LOAD FEED (REAL-TIME) ================= */

function loadFeed() {
  if (!feedEl) return;

  feedEl.innerHTML = `<div class="card muted">Loading feed…</div>`;

  let q;

  if (currentSort === "popular") {
    q = query(
      collection(db, "posts"),
      orderBy("likesCount", "desc"),
      limit(20)
    );
  } else {
    q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }

  onSnapshot(q, (snap) => {
    feedEl.innerHTML = "";

    if (snap.empty) {
      feedEl.innerHTML =
        `<div class="card muted">No posts yet.</div>`;
      return;
    }

    snap.forEach((docSnap) => {
      const post = docSnap.data();
      feedEl.appendChild(renderPost(docSnap.id, post));
    });
  });
}

/* ================= RENDER POST ================= */

function renderPost(postId, p) {
  const div = document.createElement("div");
  div.className = "card feed-card";

  const isOwner = currentUser && currentUser.uid === p.authorId;

  div.innerHTML = `
    <div class="feed-header">
      <strong>${escapeHTML(p.authorName)}</strong>
      <span class="muted small">${timeAgo(p.createdAt)}</span>
    </div>

    <div class="feed-content">
      ${escapeHTML(p.content)}
    </div>

    <div class="feed-actions">
      <button class="likeBtn" data-id="${postId}">
        ❤️ <span>${p.likesCount || 0}</span>
      </button>

      <button class="commentToggle">
        💬 ${p.commentsCount || 0}
      </button>

      ${isOwner ? `
        <button class="editBtn">✏️</button>
        <button class="deleteBtn">🗑️</button>
      ` : ""}
    </div>

    <div class="comments hidden">
      <div class="comment-list"></div>
      <form class="comment-form">
        <input placeholder="Reply with a practical solution…" required />
        <button>Post</button>
      </form>
    </div>
  `;

  attachEvents(div, postId, p);

  return div;
}

/* ================= EVENTS ================= */

function attachEvents(div, postId, postData) {

  const likeBtn = div.querySelector(".likeBtn");
  const commentToggle = div.querySelector(".commentToggle");
  const commentBox = div.querySelector(".comments");
  const commentList = div.querySelector(".comment-list");
  const commentForm = div.querySelector(".comment-form");

  /* ===== LIKE SYSTEM (SCALABLE SUBCOLLECTION) ===== */

  likeBtn.onclick = async () => {
    if (!currentUser) {
      alert("Login to like posts.");
      return;
    }

    const likeRef = doc(db, "posts", postId, "likes", currentUser.uid);
    const postRef = doc(db, "posts", postId);

    const likeSnap = await getDoc(likeRef);

    if (likeSnap.exists()) {
      await deleteDoc(likeRef);
      await updateDoc(postRef, {
        likesCount: increment(-1)
      });
    } else {
      await setDoc(likeRef, {
        createdAt: serverTimestamp()
      });
      await updateDoc(postRef, {
        likesCount: increment(1)
      });
    }
  };

  /* ===== COMMENTS ===== */

  commentToggle.onclick = () => {
    commentBox.classList.toggle("hidden");
    if (!commentBox.classList.contains("hidden")) {
      loadComments(postId, commentList);
    }
  };

  commentForm.onsubmit = (e) =>
    submitComment(e, postId, commentList);

  /* ===== DELETE ===== */

  const deleteBtn = div.querySelector(".deleteBtn");
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      if (!confirm("Delete this post?")) return;
      await deleteDoc(doc(db, "posts", postId));
    };
  }

  /* ===== EDIT ===== */

  const editBtn = div.querySelector(".editBtn");
  if (editBtn) {
    editBtn.onclick = async () => {
      const newContent = prompt("Edit your post:", postData.content);
      if (!newContent) return;

      await updateDoc(doc(db, "posts", postId), {
        content: newContent
      });
    };
  }
}

/* ================= COMMENTS ================= */

async function loadComments(postId, list) {

  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, (snap) => {
    list.innerHTML = "";

    if (snap.empty) {
      list.innerHTML =
        `<p class="muted">No replies yet.</p>`;
      return;
    }

    snap.forEach((d) => {
      list.appendChild(renderComment(d.data()));
    });
  });
}

function renderComment(c) {
  const div = document.createElement("div");
  div.className = "comment-item";

  div.innerHTML = `
    <strong>${escapeHTML(c.authorName)}</strong>
    <span class="muted small"> · ${timeAgo(c.createdAt)}</span>
    <p>${escapeHTML(c.content)}</p>
  `;

  return div;
}

async function submitComment(e, postId, list) {
  e.preventDefault();
  if (!currentUser) return;

  const input = e.target.querySelector("input");
  const content = input.value.trim();
  if (!content) return;

  await addDoc(
    collection(db, "posts", postId, "comments"),
    {
      authorId: currentUser.uid,
      authorName: currentUser.displayName || "User",
      content,
      createdAt: serverTimestamp()
    }
  );

  await updateDoc(doc(db, "posts", postId), {
    commentsCount: increment(1)
  });

  input.value = "";
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
