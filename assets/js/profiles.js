/* =========================================================
   InstMates – Profiles Directory
   FINAL – PROFILE-ONLY SOURCE (CLEAN ARCHITECTURE)
========================================================= */

import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const grid = document.getElementById("profilesGrid");

async function loadProfiles() {
  if (!grid) return;

  grid.innerHTML = `<p class="muted">Loading profiles…</p>`;

  try {

    const snap = await getDocs(collection(db, "profiles"));

    if (snap.empty) {
      grid.innerHTML = `<p class="muted">No users found.</p>`;
      return;
    }

    grid.innerHTML = "";

    snap.forEach(docSnap => {

      const profile = docSnap.data();
      const uid = docSnap.id;

      const isPublic = profile.publicProfile !== false;

      if (!isPublic) return;

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${escapeHTML(profile.fullName || "Technician")}</h3>

        <p class="muted">
          ${escapeHTML(profile.role || "Instrument / Analyzer Technician")}
        </p>

        ${profile.location
          ? `<p class="muted">📍 ${escapeHTML(profile.location)}</p>`
          : ""
        }

        <div class="tags">
          ${(profile.skills || [])
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
    console.error("Profiles load error:", err);
    grid.innerHTML = `<p class="muted">Failed to load profiles.</p>`;
  }
}

loadProfiles();

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
