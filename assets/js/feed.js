/* =========================================================
   InstMates – Feed Logic (PHASE 2 – UX POLISHED FINAL)
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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */

const feedEl   = document.getElementById("feedList");
const form     = document.getElementById("postForm");
const textarea = document.getElementById("postContent");
const statusEl = document.getElementById("postStatus");

/* ================= AUTH ================= */

onAuthStateChanged(auth, (user) => {
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
      feedEl.appendChild(renderPost(docSnap.data()));
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

    const user = auth.currentUser;
    const content = textarea.value.trim();
    const btn = form.querySelector("button");

    if (!user || !content) return;

    btn.disabled = true;
    btn.textContent = "Posting…";

    try {
      const profileSnap = await getDoc(
        doc(db, "profiles", user.uid)
      );

      if (!profileSnap.exists()) {
        alert("Complete your profile before posting.");
        return;
      }

      const profile = profileSnap.data();

      await addDoc(collection(db, "posts"), {
        uid: user.uid,
        authorName: profile.fullName,
        authorRole: profile.role,
        content,
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

/* ================= RENDER ================= */

function renderPost(p) {
  const card = document.createElement("div");
  card.className = "post-card";

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
      ❤️ 0 &nbsp; 💬 0
    </div>
  `;

  return card;
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
