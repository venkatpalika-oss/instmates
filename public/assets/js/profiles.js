/* =========================================================
   InstMates – Profiles Directory (Production Version)
   Supports OLD + NEW schema. W0.1/W0.3 hardening:
   - every user field goes through /assets/js/safe-html.js
   - photo URLs must be Firebase Storage URLs
   - the query asks Firestore for PUBLIC profiles only, so the
     rules (not this file) decide what is visible
========================================================= */

import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { esc, safeStorageUrl, idParam } from "./safe-html.js";

const grid = document.getElementById("profilesGrid");
const searchInput = document.getElementById("profileSearch");

let allProfiles = [];

/* ================= LOAD PROFILES ================= */

async function loadProfiles() {

  if (!grid) return;

  grid.innerHTML = `<p class="muted">Loading profiles…</p>`;

  try {
    // Rules only allow listing profiles whose profileStatus.isPublic == true,
    // so the query must carry that filter (Firestore rules are not filters).
    const snap = await getDocs(
      query(collection(db, "profiles"), where("profileStatus.isPublic", "==", true))
    );

    if (snap.empty) {
      grid.innerHTML = `<p class="muted">No technicians found.</p>`;
      return;
    }

    allProfiles = [];

    snap.forEach(docSnap => {
      const profile = docSnap.data() || {};
      profile.uid = docSnap.id;
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

function str(value, max = 200) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function createProfileCard(profile) {

  const uid = profile.uid;
  const safeUID = idParam(uid);

  const basic = profile.basicInfo || {};
  const professional = profile.professional || {};

  // ===== BACKWARD COMPATIBILITY =====

  const fullName =
    str(basic.fullName, 100) ||
    str(profile.fullName, 100) ||
    "Technician";

  const role =
    str(basic.headline, 150) ||
    str(profile.role, 150) ||
    "Instrument / Analyzer Technician";

  const location =
    str(basic.location, 100) ||
    str(profile.location, 100) ||
    "";

  const specialization =
    str(professional.specialization, 150) ||
    str(profile.primaryDomain, 150) ||
    "";

  const photo = safeStorageUrl(basic.profilePhoto || profile.photoURL, "");

  const completion = getCompletion(profile);

  const card = document.createElement("div");
  card.className = "card profile-card";

  const avatarHTML = photo
    ? `<img src="${esc(photo)}"
            class="avatar"
            alt="" />`
    : `<div class="avatar placeholder">
         ${esc(fullName.trim().charAt(0).toUpperCase() || "T")}
       </div>`;

  card.innerHTML = `
    ${avatarHTML}

    <h3>${esc(fullName)}</h3>

    <p class="muted">${esc(role)}</p>

    ${location
      ? `<p class="muted">📍 ${esc(location)}</p>`
      : ""
    }

    ${specialization
      ? `<p class="muted">🔧 ${esc(specialization)}</p>`
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

      <!-- W0: "Message" button hidden - messaging is not functional
           (message.html script fails to load; no Firestore rules). -->

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
    (Array.isArray(professional.analyzersWorked) && professional.analyzersWorked.length > 0) ||
    (Array.isArray(profile.skills) && profile.skills.length > 0)
  ) score++;

  if (
    achievement.title ||
    profile.majorTroubleshooting
  ) score++;

  return Math.max(0, Math.min(100, Math.round((score / total) * 100)));
}

/* ================= SEARCH ================= */

if (searchInput) {
  searchInput.addEventListener("input", () => {

    const term = searchInput.value.toLowerCase();

    const filtered = allProfiles.filter(profile => {

      const basic = profile.basicInfo || {};
      const professional = profile.professional || {};

      return (
        str(basic.fullName || profile.fullName)
          .toLowerCase().includes(term) ||

        str(basic.headline || profile.role)
          .toLowerCase().includes(term) ||

        str(basic.location || profile.location)
          .toLowerCase().includes(term) ||

        str(professional.specialization || profile.primaryDomain)
          .toLowerCase().includes(term)
      );

    });

    renderProfiles(filtered);
  });
}

/* ================= INIT ================= */

loadProfiles();
