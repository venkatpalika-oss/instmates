/* =========================================================
   InstMates - Profile Setup Logic (FIXED)
   File: assets/js/profile.js
========================================================= */

import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import { doc, updateDoc, getDoc, serverTimestamp } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= AUTH GUARD + LOAD PROFILE ================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = snap.data();

  // 🔹 Autofill form (IMPORTANT)
  const nameEl = document.getElementById("fullName");
  const roleEl = document.getElementById("role");
  const skillsEl = document.getElementById("skills");

  if (nameEl) nameEl.value = data.name || "";
  if (roleEl) roleEl.value = data.role || "";
  if (skillsEl) skillsEl.value = (data.skills || []).join(", ");

  // ❌ REMOVED forced redirect
  // User is now allowed to edit profile anytime
});

/* ================= SAVE PROFILE ================= */

document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return;

  const fullName = document.getElementById("fullName").value.trim();
  const role = document.getElementById("role").value;
  const skillsInput = document.getElementById("skills").value;

  const skills = skillsInput
    ? skillsInput.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  await updateDoc(doc(db, "users", user.uid), {
    name: fullName,
    role,
    skills,
    profileCompleted: true,
    updatedAt: serverTimestamp()
  });

  // ✅ Redirect to PUBLIC profile (better UX)
  window.location.href = `/profile-view.html?uid=${user.uid}`;
});
