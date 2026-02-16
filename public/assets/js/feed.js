/* =========================================================
   InstMates – Professional Feed Logic
========================================================= */

import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const feedContainer = document.getElementById("feedContainer");
const postInput = document.getElementById("postInput");
const postBtn = document.getElementById("postBtn");

/* ================= CREATE POST ================= */

if (postBtn) {
  postBtn.addEventListener("click", async () => {

    const content = postInput.value.trim();
    if (!content) return;

    try {
      await addDoc(collection(db, "posts"), {
        content,
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: {},
        name: "Technician",   // Later we link auth profile
        role: "Instrument Technician",
        photoURL: ""
      });

      postInput.value = "";

    } catch (err) {
      console.error("Post error:", err);
    }
  });
}

/* ================= REAL-TIME FEED ================= */

const postsQuery = query(
  collection(db, "posts"),
  orderBy("createdAt", "desc")
);

onSnapshot(postsQuery, snapshot => {

  feedContainer.innerHTML = "";

  if (snapshot.empty) {
    feedContainer.innerHTML =
      `<div class="card muted">No posts yet.</div>`;
    return;
  }

  snapshot.forEach(docSnap => {
    const post = docSnap.data();
    post.id = docSnap.id;

    const card = createPostCard(post);
    feedContainer.appendChild(card);
  });

});

/* ================= CREATE POST CARD ================= */

function createPostCard(post) {

  const card = document.createElement("div");
  card.className = "card feed-card";

  const timeAgo = formatTime(post.createdAt?.toDate?.() || new Date());

  const avatarHTML = post.photoURL
    ? `<img src="${escapeHTML(post.photoURL)}" class="avatar-sm" />`
    : `<div class="avatar-sm placeholder">
         ${(post.name || "T")[0].toUpperCase()}
       </div>`;

  card.innerHTML = `
    <div class="feed-header">
      ${avatarHTML}

      <div>
        <strong>${escapeHTML(post.name || "Technician")}</strong>
        <div class="muted small">
          ${escapeHTML(post.role || "Technician")} · ${timeAgo}
        </div>
      </div>
    </div>

    <div class="feed-content">
      ${escapeHTML(post.content)}
    </div>

    <div class="feed-actions">
      <button class="feed-btn like-btn" data-id="${post.id}">
        👍 ${post.likes || 0}
      </button>
    </div>
  `;

  /* Like button logic */
  const likeBtn = card.querySelector(".like-btn");
  likeBtn.addEventListener("click", async () => {
    try {
      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, {
        likes: increment(1)
      });
    } catch (err) {
      console.error("Like error:", err);
    }
  });

  return card;
}

/* ================= TIME FORMAT ================= */

function formatTime(date) {

  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = [
    { label: "y", seconds: 31536000 },
    { label: "mo", seconds: 2592000 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 }
  ];

  for (let i of intervals) {
    const count = Math.floor(seconds / i.seconds);
    if (count >= 1) return count + i.label;
  }

  return "Just now";
}

/* ================= SAFE ESCAPE ================= */

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
