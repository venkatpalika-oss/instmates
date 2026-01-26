/* =========================================================
   InstMates – Feed Logic (PHASE 2 – FINAL)
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
  serverTimestamp,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */

const feedEl = document.querySelector(".feed");

/* ================= AUTH + LOAD FEED ================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) return; // feed-guard handles redirect

  loadFeed();
});

/* ================= LOAD POSTS ================= */

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
      const p = docSnap.data();
      feedEl.appendChild(renderPost(p));
    });

  } catch (err) {
    console.error("Feed load error:", err);
    feedEl.innerHTML = `<p class="muted">Failed to load feed.</p>`;
  }
}

/* ================= RENDER POST ================= */

function renderPost(p) {
  const card = document.createElement("div");
  card.className = "post-card";

  card.innerHTML = `
    <div class="post-header">
      <div class="avatar small"></div>
      <div>
        <strong>${escape(p.authorName || "Unknown")}</strong><br>
        <span class="muted">${escape(p.authorRole || "")}</span>
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
