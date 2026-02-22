/* =========================================================
   InstMates – Social Technical Feed (FINAL PRO STABLE)
   Real-time Posts
   Reactions (Agree / FacedThis / Helpful)
   Edit / Delete
   Category Filter Ready
   LIVE Comments (Optimized)
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
  onSnapshot,
  limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */

const feedContainer = document.getElementById("feedContainer");
const postInput = document.getElementById("postInput");
const postBtn = document.getElementById("postBtn");
const postTypeSelect = document.getElementById("postType");

/* ================= STATE ================= */

let selectedCategory = "all";
let usersCache = {};
let unsubscribePosts = null;

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
   REAL-TIME POSTS LISTENER
========================================================= */

function listenPosts() {

  if (unsubscribePosts) unsubscribePosts();

  const postsQuery = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  unsubscribePosts = onSnapshot(postsQuery, snapshot => {

    feedContainer.innerHTML = "";

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
   CREATE POST CARD
========================================================= */

function createPostCard(post) {

  const card = document.createElement("div");
  card.className = "card feed-card";

  const user = auth.currentUser;
  const isOwner = user && user.uid === post.uid;

  const profile = usersCache[post.uid] || {};
  const userName = profile.name || "Technician";

  const totalVotes =
    (post.reactions?.agree || 0) +
    (post.reactions?.faced || 0) +
    (post.reactions?.helpful || 0);

  const hasVoted =
    user && post.votedBy && post.votedBy[user.uid];

  card.innerHTML = `
    <div class="feed-header">
      <strong>${escapeHTML(userName)}</strong>
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

      <button class="toggle-comments">💬 Comments</button>
    </div>

    <div class="comments-section" style="display:none;margin-top:10px;">
      <div class="comments-list"></div>

      <div style="margin-top:10px;">
        <input type="text" class="comment-input" placeholder="Write a comment..." style="width:75%;padding:6px;">
        <button class="comment-btn">Post</button>
      </div>
    </div>

    ${isOwner ? `
      <div style="margin-top:10px;">
        <button class="edit-btn">✏ Edit</button>
        <button class="delete-btn" style="color:red;">🗑 Delete</button>
      </div>
    ` : ""}
  `;

/* ================= REACTIONS ================= */

  card.querySelectorAll(".react").forEach(btn => {

    btn.addEventListener("click", async () => {

      if (!auth.currentUser) return;

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
        content: newContent,
        editedAt: serverTimestamp()
      });
    });

    card.querySelector(".delete-btn").addEventListener("click", async () => {

      if (!confirm("Delete post?")) return;

      await deleteDoc(doc(db, "posts", post.id));
    });
  }

/* ================= LIVE COMMENTS ================= */

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

        snapshot.forEach(docSnap => {

          const comment = docSnap.data();
          const commentUser =
            usersCache[comment.uid]?.name ||
            comment.uid.substring(0, 6);

          const commentDiv = document.createElement("div");
          commentDiv.style.marginBottom = "6px";

          commentDiv.innerHTML = `
            <strong>${escapeHTML(commentUser)}</strong>:
            ${escapeHTML(comment.content)}
            <span class="muted small">
              • ${formatTime(comment.createdAt?.toDate?.() || new Date())}
            </span>
          `;

          commentsList.appendChild(commentDiv);
        });
      });
    }
  });

  commentBtn.addEventListener("click", async () => {

    const content = commentInput.value.trim();
    if (!content || !auth.currentUser) return;

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

  return card;
}

/* =========================================================
   INIT
========================================================= */

(async () => {
  await loadUsers();
  listenPosts();
})();

/* ========================================================= */

function formatTime(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const hours = Math.floor(seconds / 3600);
  if (hours >= 1) return hours + "h";
  const minutes = Math.floor(seconds / 60);
  if (minutes >= 1) return minutes + "m";
  return "Just now";
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}