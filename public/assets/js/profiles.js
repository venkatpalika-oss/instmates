/* =========================================================
   InstMates – Profiles Directory (Production Version)
========================================================= */

import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const grid = document.getElementById("profilesGrid");
const searchInput = document.getElementById("profileSearch");

let allProfiles = [];

/* ================= LOAD PROFILES ================= */

async function loadProfiles() {

  if (!grid) return;

  grid.innerHTML = `<p class="muted">Loading profiles…</p>`;

  try {
    const snap = await getDocs(collection(db, "profiles"));

    if (snap.empty) {
      grid.innerHTML = `<p class="muted">No technicians found.</p>`;
      return;
    }

    allProfiles = [];

    snap.forEach(docSnap => {
      const profile = docSnap.data();
      profile.uid = docSnap.id;

      // Only show public profiles
      if (profile.publicProfile === false) return;

      allProfiles.push(profile);
    });

    renderProfiles(allProfiles);

  } catch (err) {
    console.error("Profiles load error:", err);
    grid.innerHTML =
      `<p class="muted">Failed to load profiles.</p>`;
  }
}

/* ================= RENDER ================= */

function renderProfiles(list) {

  grid.innerHTML = "";

  if (list.length === 0) {
    grid.innerHTML = `<p class="muted">No matching profiles found.</p>`;
    return;
  }

  list.forEach(profile => {
    const card = createProfileCard(profile);
    grid.appendChild(card);
  });
}

/* ================= CREATE CARD ================= */

function createProfileCard(profile) {

  const uid = profile.uid;
  const completion = getCompletion(profile);

  const card = document.createElement("div");
  card.className = "card profile-card";

  const avatarHTML = profile.photoURL
    ? `<img src="${escapeHTML(profile.photoURL)}"
            class="avatar"
            alt="Avatar" />`
    : `<div class="avatar placeholder">
         ${(profile.fullName || "T")[0].toUpperCase()}
       </div>`;

  card.innerHTML = `
    ${avatarHTML}

    <h3>${escapeHTML(profile.fullName || "Technician")}</h3>

    <p class="muted">
      ${escapeHTML(profile.role || "Instrument / Analyzer Technician")}
    </p>

    ${profile.location
      ? `<p class="muted">📍 ${escapeHTML(profile.location)}</p>`
      : ""
    }

    ${profile.primaryDomain
      ? `<p class="muted">🔧 ${escapeHTML(profile.primaryDomain)}</p>`
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

    <!-- Completion -->
    <div class="completion-bar">
      <div class="completion-fill"
           style="width:${completion}%">
      </div>
    </div>
    <small class="muted">${completion}% profile complete</small>

    <div class="action-row" style="margin-top:12px;">
      <a class="btn btn-ghost"
         href="/profile.html?uid=${uid}"
         View Profile
      </a>

      <a class="btn btn-primary"
         href="/message.html?to=${uid}">
         Message
      </a>
    </div>
  `;

  return card;
}

/* ================= PROFILE COMPLETION ================= */

function getCompletion(profile) {

  let total = 8;
  let score = 0;

  if (profile.fullName) score++;
  if (profile.role) score++;
  if (profile.location) score++;
  if (profile.primaryDomain) score++;
  if (profile.experienceYears) score++;
  if (profile.skills && profile.skills.length > 0) score++;
  if (profile.summary) score++;
  if (profile.majorTroubleshooting && profile.majorTroubleshooting.length > 0) score++;

  return Math.round((score / total) * 100);
}

/* ================= SEARCH ================= */

if (searchInput) {
  searchInput.addEventListener("input", () => {

    const term = searchInput.value.toLowerCase();

    const filtered = allProfiles.filter(profile => {

      return (
        (profile.fullName || "").toLowerCase().includes(term) ||
        (profile.role || "").toLowerCase().includes(term) ||
        (profile.location || "").toLowerCase().includes(term) ||
        (profile.primaryDomain || "").toLowerCase().includes(term) ||
        (profile.skills || []).join(" ").toLowerCase().includes(term)
      );

    });

    renderProfiles(filtered);
  });
}

/* ================= SAFE ESCAPE ================= */

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ================= INIT ================= */

loadProfiles();
