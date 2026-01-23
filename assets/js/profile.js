/* =========================================================
   InstMates - Profile Setup Logic
   File: assets/js/profile.js
========================================================= */

import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import { doc, updateDoc, getDoc, serverTimestamp } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= AUTH GUARD ================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    const data = snap.data();
    if (data.profileCompleted) {
      window.location.href = "/explore.html";
    }
  }
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

  window.location.href = "/explore.html";
});
