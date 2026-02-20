/* =========================================================
   InstMates – Social Technical Feed (FINAL PRODUCTION)
   Infinite Scroll • Verified Badge • Category Filter
   Slide Animation • Edit/Delete • 1 Vote Per User
   UPDATED: Post Type Selector Support (SAFE EXTENSION)
========================================================= */

import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  getDocs,
  limit,
  startAfter
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const feedContainer = document.getElementById("feedContainer");
const postInput = document.getElementById("postInput");
const postBtn = document.getElementById("postBtn");
const postTypeSelect = document.getElementById("postType");

let lastVisible = null;
let loading = false;
let selectedCategory = "all";
let usersCache = {};

/* =========================================================
   CATEGORY FILTER WITH SLIDE ANIMATION
========================================================= */

createCategoryFilter();

function createCategoryFilter() {

  const wrapper = document.createElement("div");
  wrapper.style.margin = "20px 0";

  wrapper.innerHTML = `
    <div class="feed-filters">
      <button class="filter-btn active" data-type="all">All</button>
      <button class="filter-btn" data-type="fault">🔴 Fault</button>
      <button class="filter-btn" data-type="question">❓ Question</button>
      <button class="filter-btn" data-type="solution">✅ Solution</button>
      <button class="filter-btn" data-type="calibration">📊 Calibration</button>
    </div>
  `;

  feedContainer.parentNode.insertBefore(wrapper, feedContainer);

  wrapper.querySelectorAll(".filter-btn").forEach(btn => {

    btn.addEventListener("click", async () => {

      if (btn.classList.contains("active")) return;

      document.querySelectorAll(".filter-btn")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      selectedCategory = btn.dataset.type;

      feedContainer.style.opacity = "0";
      feedContainer.style.transform = "translateX(20px)";
      feedContainer.style.transition = "all 0.2s ease";

      setTimeout(async () => {

        feedContainer.innerHTML = "";
        lastVisible = null;
        await loadPosts();

        feedContainer.style.transform = "translateX(0)";
        feedContainer.style.opacity = "1";

      }, 200);

    });

  });
}

/* =========================================================
   CREATE POST
========================================================= */

if (postBtn) {
  postBtn.addEventListener("click", async () => {

    const content = postInput.value.trim();
    if (!content || !auth.currentUser) return;

    const selectedType = postTypeSelect?.value || "question";

    await addDoc(collection(db, "posts"), {
      content,
      uid: auth.currentUser.uid,
      type: selectedType,
      createdAt: serverTimestamp(),
      editedAt: null,
      reactions: { agree: 0, faced: 0, helpful: 0 },
      votedBy: {}
    });

    postInput.value = "";
  });
}

/* =========================================================
   LOAD USERS CACHE
========================================================= */

async function loadUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  snapshot.forEach(docSnap => {
    usersCache[docSnap.id] = docSnap.data();
  });
}

/* =========================================================
   LOAD POSTS (PAGINATED)
========================================================= */

async function loadPosts() {

  if (loading) return;
  loading = true;

  let postsQuery = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(10)
  );

  if (lastVisible) {
    postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      startAfter(lastVisible),
      limit(10)
    );
  }

  const snapshot = await getDocs(postsQuery);

  if (!snapshot.empty) {
    lastVisible = snapshot.docs[snapshot.docs.length - 1];
  }

  snapshot.forEach(docSnap => {

    const post = docSnap.data();
    post.id = docSnap.id;

    if (selectedCategory !== "all" &&
        post.type !== selectedCategory) return;

    feedContainer.appendChild(createPostCard(post));
  });

  loading = false;
}

/* =========================================================
   INFINITE SCROLL
========================================================= */

window.addEventListener("scroll", () => {

  if (
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 200
  ) {
    loadPosts();
  }
});

/* =========================================================
   CREATE POST CARD
========================================================= */

function createPostCard(post) {

  const card = document.createElement("div");
  card.className = "card feed-card";

  const user = auth.currentUser;
  const isOwner = user && user.uid === post.uid;
  const hasVoted = user && post.votedBy && post.votedBy[user.uid];

  const profile = usersCache[post.uid] || {};
  const verifiedBadge = profile.verified
    ? `<span style="color:#0b5ed7;font-size:12px;"> ✔ Verified</span>`
    : "";

  const totalVotes =
    (post.reactions?.agree || 0) +
    (post.reactions?.faced || 0) +
    (post.reactions?.helpful || 0);

  card.innerHTML = `
    <div class="feed-header">
      <strong>
        ${escapeHTML(profile.name || "Technician")}
        ${verifiedBadge}
      </strong>
      <div class="muted small">
        ${formatTime(post.createdAt?.toDate?.() || new Date())}
      </div>
    </div>

    <div class="feed-content">
      ${escapeHTML(post.content)}
    </div>

    <div class="muted small" style="margin-top:6px;">
      🔥 ${totalVotes} Technical Reactions
    </div>

    <div class="feed-actions">
      <button class="react" data-type="agree" ${hasVoted ? "disabled" : ""}>
        👍 Agree (${post.reactions?.agree || 0})
      </button>

      <button class="react" data-type="faced" ${hasVoted ? "disabled" : ""}>
        🛠 Faced This (${post.reactions?.faced || 0})
      </button>

      <button class="react" data-type="helpful" ${hasVoted ? "disabled" : ""}>
        💡 Helpful (${post.reactions?.helpful || 0})
      </button>
    </div>

    ${isOwner ? `
      <div style="margin-top:10px;">
        <button class="edit-btn">✏ Edit</button>
        <button class="delete-btn" style="color:red;">🗑 Delete</button>
      </div>
    ` : ""}
  `;

  card.querySelectorAll(".react").forEach(btn => {

    btn.addEventListener("click", async () => {

      if (!auth.currentUser || hasVoted) return;

      const type = btn.dataset.type;
      const postRef = doc(db, "posts", post.id);

      await updateDoc(postRef, {
        [`reactions.${type}`]: increment(1),
        [`votedBy.${auth.currentUser.uid}`]: true
      });

      btn.disabled = true;
    });

  });

  if (isOwner) {

    card.querySelector(".edit-btn").addEventListener("click", async () => {

      const newContent = prompt("Edit post:", post.content);
      if (!newContent) return;

      await updateDoc(doc(db, "posts", post.id), {
        content: newContent,
        editedAt: serverTimestamp()
      });
    });

    card.querySelector(".delete-btn").addEventListener("click", async () => {

      if (!confirm("Delete post?")) return;

      await deleteDoc(doc(db, "posts", post.id));
      card.remove();
    });
  }

  return card;
}

/* =========================================================
   INIT
========================================================= */

(async () => {
  await loadUsers();
  await loadPosts();
})();

/* =========================================================
   TIME FORMAT
========================================================= */

function formatTime(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return hours + "h";
  const minutes = Math.floor(seconds / 60);
  if (minutes >= 1) return minutes + "m";
  return "Just now";
}

/* =========================================================
   ESCAPE
========================================================= */

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
