console.log("PROFILES JS ACTIVE");

/* =========================================================
   InstMates – Profiles Directory
   FINAL – PROFILE-ONLY SOURCE
========================================================= */

import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const grid = document.getElementById("profilesGrid");

async function loadProfiles() {

  if (!grid) {
    console.warn("profilesGrid element not found.");
    return;
  }

  grid.innerHTML = `<p class="muted">Loading profiles…</p>`;

  try {

    const snap = await getDocs(collection(db, "profiles"));

    console.log("Profiles found:", snap.size);

    if (snap.empty) {
      grid.innerHTML = `<p class="muted">No technicians found.</p>`;
      return;
    }

    grid.innerHTML = "";

    let visibleCount = 0;

    snap.forEach(docSnap => {

      const profile = docSnap.data();
      const uid = docSnap.id;

      // Default to true unless explicitly false
      const isPublic = profile.publicProfile !== false;

      if (!isPublic) return;

      visibleCount++;

      const card = document.createElement("div");
      card.className = "card profile-card";

      card.innerHTML = `
        <h3>${escapeHTML(profile.fullName || "Technician")}</h3>

        <p class="muted">
          ${escapeHTML(profile.role || "Instrument / Analyzer Technician")}
        </p>

        ${profile.location
          ? `<p class="muted">📍 ${escapeHTML(profile.location)}</p>`
          : ""
        }

        ${Array.isArray(profile.skills) && profile.skills.length > 0
          ? `
            <div class="tags">
              ${profile.skills
                .map(skill => `<span class="tag">${escapeHTML(skill)}</span>`)
                .join("")}
            </div>
          `
          : ""
        }

        <div class="action-row" style="margin-top:12px;">
          <a
