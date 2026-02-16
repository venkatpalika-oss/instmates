/* =========================================================
   InstMates – Profiles Directory (USERS + PROFILES)
   File: /assets/js/profiles.js
   FINAL – PRODUCTION SAFE
========================================================= */

import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const grid = document.getElementById("profilesGrid");

/* ================= LOAD USERS + PROFILES ================= */

async function loadProfiles() {
  if (!grid) return;

  grid.innerHTML = `<p class="muted">Loading profiles…</p>`;

  try {
    /* ---------- FETCH PROFILES ---------- */
    const profilesSnap = await getDocs(collection(db, "profiles"));
    const profilesMap = {};

    profilesSnap.forEach(doc => {
      profilesMap[doc.id] = doc.data();
    });

    /* ---------- FETCH USERS ---------- */
    const usersSnap = await getDocs(collection(db, "users"));

    if (usersSnap.empty) {
      grid.innerHTML = `<p class="muted">No users found.</p>`;
      return;
    }

    grid.innerHTML = "";

    let visibleCount = 0;

    usersSnap.forEach(docSnap => {
      const user = docSnap.data();
      const uid = docSnap.id;

      const profile = profilesMap[uid] || {};

      // ✅ FIX: profileCompleted must come from USERS collection
      const isCompleted = user.profileCompleted === true;

      // Hide only if explicitly private
      const isPublic = profile.publicProfile !== false;
      if (!isPublic) return;

      visibleCount++;

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${escapeHTML(profile.fullName || user.name || "Technician")}</h3>

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

        ${!isCompleted
          ? `<p class="muted" style="color:#c62828;margin-top:8px">
              ⚠ Profile not completed
            </p>`
          : ""
        }

        <div class="action-row" style="margin-top:12px;">
          ${isCompleted
            ? `<a class="btn btn-ghost"
                 href="/profile-view.html?uid=${uid}">
                 View Profile
               </a>`
            : `<span class="muted">Profile pending</span>`
          }

          <a class="btn btn-primary"
             href="/message.html?to=${uid}">
             Message
          </a>
        </div>
      `;

      grid.appendChild(card);
    });

    if (visibleCount === 0) {
      grid.innerHTML = `<p class="muted">No public profiles available.</p>`;
    }

  } catch (err) {
    console.error("Profiles load error:", err);
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
