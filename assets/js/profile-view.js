/* =========================================================
   InstMates - Public Profile View
   File: assets/js/profile-view.js
========================================================= */

import { db } from "./firebase.js";

import { doc, getDoc } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= GET UID FROM URL ================= */

const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");

if (!uid) {
  document.getElementById("profileName").textContent = "Profile not found";
  throw new Error("No UID provided");
}

/* ================= LOAD PROFILE ================= */

async function loadProfile() {
  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) {
    document.getElementById("profileName").textContent = "Profile not found";
    return;
  }

  const data = snap.data();

  document.getElementById("profileName").textContent =
    data.name || "InstMates Member";

  document.getElementById("profileRole").textContent =
    data.role || "Field Professional";

  // Skills
  const skillsGrid = document.getElementById("skillsGrid");
  skillsGrid.innerHTML = "";

  (data.skills || []).forEach(skill => {
    const span = document.createElement("span");
    span.className = "skill";
    span.textContent = skill;
    skillsGrid.appendChild(span);
  });
}

loadProfile();
