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
  deleteDoc,
  increment,
  getDocs,
  onSnapshot,
  limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

/* ================= ELEMENTS ================= */

const feedContainer = document.getElementById("feedContainer");
const postInput = document.getElementById("postInput");
const postBtn = document.getElementById("postBtn");
const postTypeSelect = document.getElementById("postType");
const fileInput = document.getElementById("fileInput");

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
    const file = fileInput?.files[0];

    if (!content && !file) return;
    if (!auth.currentUser) return;

    let attachment = null;

    if (file) {

      if (file.size > 20 * 1024 * 1024) {
        alert("Maximum file size is 20MB");
        return;
      }

      const filePath =
        `postAttachments/${auth.currentUser.uid}/${Date.now()}_${file.name}`;

      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      let type = "file";

      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("video/")) type = "video";
      else if (file.type === "application/pdf") type = "pdf";

      attachment = {
        url: downloadURL,
        type,
        name: file.name
      };
    }

    await addDoc(collection(db, "posts"), {
      content: content || "",
      uid: auth.currentUser.uid,
      type: postTypeSelect?.value || "question",
      attachment: attachment || null,
      createdAt: serverTimestamp(),
      editedAt: null,
      reactions: { agree: 0, faced: 0, helpful: 0 },
      votedBy: {}
    });

    postInput.value = "";
    if (fileInput) fileInput.value = "";
  });
}

/* =========================================================
   LOAD USERS
========================================================= */

async function loadUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  snapshot.forEach(docSnap => {
    usersCache[docSnap.id] = docSnap.data();
  });
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

  unsubscribePosts = onSnapshot(postsQuery, snapshot => {

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
  const userName = profile.name || profile.displayName || "Technician";

  const initials = getInitials(userName);

  const totalVotes =
    (post.reactions?.agree || 0) +
    (post.reactions?.faced || 0) +
    (post.reactions?.helpful || 0);

  const hasVoted =
    user && post.votedBy && post.votedBy[user.uid];

  const postType = post.type || "question";
  const badgeLabel = getTypeLabel(postType);
  const badgeClass = getTypeClass(postType);

  let attachmentHTML = "";

  if (post.attachment) {

    const safeUrl = escapeAttr(post.attachment.url);
    const safeName = escapeHTML(post.attachment.name || "Attachment");

    if (post.attachment.type === "image") {
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

  card.innerHTML = `
    <div class="feed-top">
      <div class="feed-user">
        <div class="avatar">${initials}</div>

        <div>
          <div class="feed-username">${escapeHTML(userName)}</div>
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

    <div class="feed-content modern-content">
      ${formatPostContent(post.content)}
    </div>

    ${attachmentHTML}

    <div class="reaction-summary">
      <span>🔥 ${totalVotes} Technical Reactions</span>
    </div>

    <div class="feed-actions modern-actions">
      <button class="react action-btn" data-type="agree" ${hasVoted ? "disabled" : ""}>
        👍 Agree <span>${post.reactions?.agree || 0}</span>
      </button>

      <button class="react action-btn" data-type="faced" ${hasVoted ? "disabled" : ""}>
        🛠 Faced This <span>${post.reactions?.faced || 0}</span>
      </button>

      <button class="react action-btn" data-type="helpful" ${hasVoted ? "disabled" : ""}>
        💡 Helpful <span>${post.reactions?.helpful || 0}</span>
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
        <button class="delete-btn">🗑 Delete</button>
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
        content: newContent.trim(),
        editedAt: serverTimestamp()
      });
    });

    card.querySelector(".delete-btn").addEventListener("click", async () => {

      if (!confirm("Delete post?")) return;

      await deleteDoc(doc(db, "posts", post.id));
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

          const commentUser =
            usersCache[comment.uid]?.name ||
            usersCache[comment.uid]?.displayName ||
            "Technician";

          const commentDiv = document.createElement("div");
          commentDiv.className = "comment-item";

          commentDiv.innerHTML = `
            <strong>${escapeHTML(commentUser)}</strong>
            <div>${escapeHTML(comment.content)}</div>
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
  await loadUsers();
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

function formatPostContent(content) {
  return escapeHTML(content || "")
    .replace(/\n/g, "<br>");
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
