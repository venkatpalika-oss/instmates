/* =========================================================
   InstMates – Public Profiles Listing (FINAL – FIXED)
   File: /assets/js/profiles.js
========================================================= */

import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const grid = document.getElementById("profilesGrid");

/* ================= LOAD PROFILES ================= */

async function loadProfiles() {
  if (!grid) return;

  grid.innerHTML = `<p class="muted">Loading profiles…</p>`;

  try {
    const q = query(
      collection(db, "profiles"),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      grid.innerHTML =
        `<p class="muted">No profiles available.</p>`;
      return;
    }

    grid.innerHTML = "";

    snap.forEach(docSnap => {
      const u = docSnap.data();
      const uid = docSnap.id;

      /* ================= VISIBILITY LOGIC =================
         Rules:
         - profileCompleted must be true
         - publicProfile defaults to TRUE if missing
      ===================================================== */

      if (u.profileCompleted !== true) return;

      if (u.publicProfile === false) return;

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${escapeHTML(u.fullName || "Technician")}</h3>
        <p class="muted">${escapeHTML(u.role || "Instrument Technician")}</p>
        ${u.location ? `<p class="muted">📍 ${escapeHTML(u.location)}</p>` : ""}

        <div class="tags">
          ${(u.skills || [])
            .map(s => `<span class="tag">${escapeHTML(s)}</span>`)
            .join("")}
        </div>

        <div class="action-row" style="margin-top:12px;">
          <a class="btn btn-ghost"
             href="/profile-view.html?uid=${uid}">
             View Profile
          </a>

          <a class="btn btn-primary"
             href="/message.html?to=${uid}">
             Message
          </a>
        </div>
      `;

      grid.appendChild(card);
    });

  } catch (err) {
    console.error("Profile load failed:", err);
    grid.innerHTML =
      `<p class="muted">Failed to load profiles.</p>`;
  }
}

loadProfiles();

/* ================= HELPERS ================= */

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
