/* =========================================================
   InstMates – Hybrid Professional Feed
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
const postType = document.getElementById("postType");
const postTags = document.getElementById("postTags");

/* ================= CREATE POST ================= */

if (postBtn) {
  postBtn.addEventListener("click", async () => {

    const content = postInput.value.trim();
    if (!content) return;

    const type = postType.value;
    const tagsArray = postTags.value
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    try {

      await addDoc(collection(db, "posts"), {
        content,
        type,
        tags: tagsArray,
        createdAt: serverTimestamp(),
        reactions: {
          agree: 0,
          faced: 0,
          helpful: 0
        },
        name: "Technician",
        role: "Instrument Technician",
        photoURL: ""
      });

      postInput.value = "";
      postTags.value = "";

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

  const badge = getTypeBadge(post.type);

  const tagsHTML = post.tags && post.tags.length
    ? `<div class="post-tags">
        ${post.tags.map(tag =>
          `<span class="tag">#${escapeHTML(tag)}</span>`
        ).join("")}
      </div>`
    : "";

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

    <div class="post-type-badge">
      ${badge}
    </div>

    <div class="feed-content">
      ${escapeHTML(post.content)}
    </div>

    ${tagsHTML}

    <div class="feed-actions">
      <button class="feed-btn react-btn" data-type="agree">
        👍 Agree (${post.reactions?.agree || 0})
      </button>

      <button class="feed-btn react-btn" data-type="faced">
        🛠 Faced This (${post.reactions?.faced || 0})
      </button>

      <button class="feed-btn react-btn" data-type="helpful">
        💡 Helpful (${post.reactions?.helpful || 0})
      </button>
    </div>
  `;

  /* Reaction logic */
  card.querySelectorAll(".react-btn").forEach(btn => {
    btn.addEventListener("click", async () => {

      const reactionType = btn.dataset.type;
      const postRef = doc(db, "posts", post.id);

      try {
        await updateDoc(postRef, {
          [`reactions.${reactionType}`]: increment(1)
        });
      } catch (err) {
        console.error("Reaction error:", err);
      }

    });
  });

  return card;
}

/* ================= TYPE BADGE ================= */

function getTypeBadge(type) {

  switch(type) {
    case "fault":
      return `<span style="color:#c62828;font-weight:600;">🔴 Fault Report</span>`;
    case "solution":
      return `<span style="color:#2e7d32;font-weight:600;">✅ Solution</span>`;
    case "calibration":
      return `<span style="color:#1565c0;font-weight:600;">📊 Calibration</span>`;
    default:
      return `<span style="color:#f9a825;font-weight:600;">❓ Question</span>`;
  }

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
