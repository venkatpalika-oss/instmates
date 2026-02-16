console.log("PROFILES JS ACTIVE");

/* =========================================================
   InstMates – Profiles Directory
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

  grid.innerHTML = '<p class="muted">Loading profiles…</p>';

  try {

    const snap = await getDocs(collection(db, "profiles"));
    console.log("Profiles found:", snap.size);

    if (snap.empty) {
      grid.innerHTML = '<p class="muted">No technicians found.</p>';
      return;
    }

    grid.innerHTML = "";
    let visibleCount = 0;

    snap.forEach(docSnap => {

      const profile = docSnap.data();
      const uid = docSnap.id;

      const isPublic = profile.publicProfile !== false;
      if (!isPublic) return;

      visibleCount++;

      const card = document.createElement("div");
      card.className = "card profile-card";

      let skillsHTML = "";
      if (Array.isArray(profile.skills) && profile.skills.length > 0) {
        skillsHTML = '<div class="tags">';
        profile.skills.forEach(skill => {
          skillsHTML += '<span class="tag">' + escapeHTML(skill) + '</span>';
        });
        skillsHTML += '</div>';
      }

      card.innerHTML =
        '<h3>' + escapeHTML(profile.fullName || "Technician") + '</h3>' +
        '<p class="muted">' +
        escapeHTML(profile.role || "Instrument / Analyzer Technician") +
        '</p>' +

        (profile.location
          ? '<p class="muted">📍 ' + escapeHTML(profile.location) + '</p>'
          : ''
        ) +

        skillsHTML +

        '<div class="action-row" style="margin-top:12px;">' +
          '<a class="btn btn-ghost" href="/profile-view.html?uid=' + uid + '">' +
            'View Profile' +
          '</a>' +
          '<a class="btn btn-primary" href="/message.html?to=' + uid + '">' +
            'Message' +
          '</a>' +
        '</div>';

      grid.appendChild(card);

    });

    if (visibleCount === 0) {
      grid.innerHTML = '<p class="muted">No public profiles available.</p>';
    }

  } catch (err) {
    console.error("Profiles load error:", err);
    grid.innerHTML = '<p class="muted">Failed to load profiles.</p>';
  }
}

loadProfiles();

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
