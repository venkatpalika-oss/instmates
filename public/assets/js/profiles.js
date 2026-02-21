/* =========================================================
   InstMates – Profiles Directory (Production Version)
   FINAL: Supports OLD + NEW Schema + Folder Routing Safe
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

      const status = profile.profileStatus || {};

      // Support both new + old public flags
      const isPublic =
        status.isPublic !== undefined
          ? status.isPublic
          : profile.publicProfile !== false;

      if (isPublic === false) return;

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
    if (card) grid.appendChild(card);
  });
}

/* ================= CREATE CARD ================= */

function createProfileCard(profile) {

  const uid = profile.uid;
  const safeUID = encodeURIComponent(uid);

  const basic = profile.basicInfo || {};
  const professional = profile.professional || {};
  const achievement = profile.achievement || {};
  const status = profile.profileStatus || {};

  // ===== BACKWARD COMPATIBILITY =====

  const fullName =
    basic.fullName ||
    profile.fullName ||
    "Technician";

  const role =
    basic.headline ||
    profile.role ||
    "Instrument / Analyzer Technician";

  const location =
    basic.location ||
    profile.location ||
    "";

  const specialization =
    professional.specialization ||
    profile.primaryDomain ||
    "";

  const photo =
    basic.profilePhoto ||
    profile.photoURL ||
    "";

  const completion = getCompletion(profile);

  const card = document.createElement("div");
  card.className = "card profile-card";

  const avatarHTML = photo
    ? `<img src="${escapeHTML(photo)}"
            class="avatar"
            alt="Avatar" />`
    : `<div class="avatar placeholder">
         ${fullName[0].toUpperCase()}
       </div>`;

  card.innerHTML = `
    ${avatarHTML}

    <h3>${escapeHTML(fullName)}</h3>

    <p class="muted">${escapeHTML(role)}</p>

    ${location
      ? `<p class="muted">📍 ${escapeHTML(location)}</p>`
      : ""
    }

    ${specialization
      ? `<p class="muted">🔧 ${escapeHTML(specialization)}</p>`
      : ""
    }

    <!-- Completion -->
    <div class="completion-bar">
      <div class="completion-fill"
           style="width:${completion}%">
      </div>
    </div>
    <small class="muted">${completion}% profile complete</small>

    <div class="action-row"
         style="margin-top:12px; display:flex; gap:10px; justify-content:center;">

      <a class="btn btn-ghost"
         href="/profile/?uid=${safeUID}">
         View Profile
      </a>

      <a class="btn btn-primary"
         href="/message.html?to=${safeUID}">
         Message
      </a>

    </div>
  `;

  return card;
}

/* ================= PROFILE COMPLETION ================= */

function getCompletion(profile) {

  const basic = profile.basicInfo || {};
  const professional = profile.professional || {};
  const achievement = profile.achievement || {};

  let total = 6;
  let score = 0;

  if (basic.fullName || profile.fullName) score++;
  if (basic.headline || profile.role) score++;
  if (basic.location || profile.location) score++;
  if (professional.specialization || profile.primaryDomain) score++;

  if (
    (professional.analyzersWorked && professional.analyzersWorked.length > 0) ||
    (profile.skills && profile.skills.length > 0)
  ) score++;

  if (
    achievement.title ||
    profile.majorTroubleshooting
  ) score++;

  return Math.round((score / total) * 100);
}

/* ================= SEARCH ================= */

if (searchInput) {
  searchInput.addEventListener("input", () => {

    const term = searchInput.value.toLowerCase();

    const filtered = allProfiles.filter(profile => {

      const basic = profile.basicInfo || {};
      const professional = profile.professional || {};

      return (
        (basic.fullName || profile.fullName || "")
          .toLowerCase().includes(term) ||

        (basic.headline || profile.role || "")
          .toLowerCase().includes(term) ||

        (basic.location || profile.location || "")
          .toLowerCase().includes(term) ||

        (professional.specialization || profile.primaryDomain || "")
          .toLowerCase().includes(term)
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