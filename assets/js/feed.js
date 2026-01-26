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
  addDoc,
  doc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */

const feedEl = document.querySelector(".feed");
const form = document.getElementById("newPostForm");
const textarea = document.getElementById("postContent");

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {
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

    if (!user || !content) return;

    try {
      // Load author profile
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
        authorRole:
