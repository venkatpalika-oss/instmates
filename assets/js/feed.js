/* =========================================================
   InstMates – Feed Logic
   PHASE 4 – COMMENTS + REPLIES (FINAL)
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

/* ================= AUTH ================= */

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) loadFeed();
});

/* ================= LOAD FEED ================= */

async function loadFeed() {
  const feed = document.querySelector(".feed");
  if (!feed) return;

  feed.innerHTML = `<p class="muted">Loading feed…</p>`;

  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  const snap = await getDocs(q);
  feed.innerHTML = "";

  snap.forEach(d => {
    feed.appendChild(renderPost(d.id, d.data()));
  });
}

/* ================= RENDER POST ================= */

function renderPost(postId, p) {
  const div = document.createElement("div");
  div.className = "post-card";

  div.innerHTML = `
    <div class="post-header">
      <strong>
        <a href="/profile-view.html?uid=${p.uid}">
          ${escape(p.authorName)}
        </a>
      </strong>
      <span class="muted"> · ${timeAgo(p.createdAt)}</span>
    </div>

    <p>${escape(p.content)}</p>

    <div class="post-actions muted">
      💬 <button class="comment-toggle">Comments</button>
    </div>

    <div class="comments" style="display:none">
      <div class="comment-list"></div>

      <form class="comment-form">
        <input placeholder="Write a comment…" required />
        <button>Post</button>
      </form>
    </div>
  `;

  const toggleBtn = div.querySelector(".comment-toggle");
  const box = div.querySelector(".comments");
  const list = div.querySelector(".comment-list");

  toggleBtn.onclick = async () => {
    box.style.display = box.style.display === "none" ? "block" : "none";
    if (box.style.display === "block") {
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

  snap.forEach(d => {
    list.appendChild(renderComment(postId, d.id, d.data()));
  });
}

async function submitComment(e, postId, list) {
  e.preventDefault();
  if (!currentUser) return;

  const input = e.target.querySelector("input");
  const content = input.value.trim();
  if (!content) return;

  const profile = (await getDoc(doc(db, "profiles", currentUser.uid))).data();

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
  loadComments(postId, list);
}

/* ================= RENDER COMMENT + REPLIES ================= */

function renderComment(postId, commentId, c) {
  const div = document.createElement("div");
  div.className = "comment";

  div.innerHTML = `
    <strong>${escape(c.authorName)}</strong>
    <p>${escape(c.content)}</p>

    <button class="reply-toggle muted">Reply</button>

    <div class="replies"></div>

    <form class="reply-form" style="display:none">
      <input placeholder="Write a reply…" required />
      <button>Reply</button>
    </form>
  `;

  const replyForm = div.querySelector(".reply-form");
  const repliesBox = div.querySelector(".replies");

  div.querySelector(".reply-toggle").onclick = async () => {
    replyForm.style.display =
      replyForm.style.display === "none" ? "block" : "none";

    await loadReplies(postId, commentId, repliesBox);
  };

  replyForm.onsubmit =
    (e) => submitReply(e, postId, commentId, repliesBox);

  return div;
}

/* ================= REPLIES ================= */

async function loadReplies(postId, commentId, box) {
  box.innerHTML = "";

  const q = query(
    collection(db, "posts", postId, "comments", commentId, "replies"),
    orderBy("createdAt", "asc")
  );

  const snap = await getDocs(q);

  snap.forEach(d => {
    const r = d.data();
    const div = document.createElement("div");
    div.className = "reply";
    div.innerHTML = `
      <strong>${escape(r.authorName)}</strong>
      <span class="muted"> · ${timeAgo(r.createdAt)}</span>
      <p>${escape(r.content)}</p>
    `;
    box.appendChild(div);
  });
}

async function submitReply(e, postId, commentId, box) {
  e.preventDefault();
  if (!currentUser) return;

  const input = e.target.querySelector("input");
  const content = input.value.trim();
  if (!content) return;

  const profile = (await getDoc(doc(db, "profiles", currentUser.uid))).data();

  await addDoc(
    collection(db, "posts", postId, "comments", commentId, "replies"),
    {
      uid: currentUser.uid,
      authorName: profile.fullName,
      content,
      createdAt: serverTimestamp()
    }
  );

  input.value = "";
  loadReplies(postId, commentId, box);
}

/* ================= HELPERS ================= */

function escape(str) {
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
