/* =========================================================
   InstMates - Profile Setup Logic (FINAL FIX)
   File: assets/js/profile.js
========================================================= */

import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import { doc, setDoc, getDoc, serverTimestamp } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= AUTH GUARD + LOAD PROFILE ================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  // Autofill ONLY if document exists
  if (snap.exists()) {
    const data = snap.data();

    const nameEl = document.getElementById("fullName");
    const roleEl = document.getElementById("role");
    const skillsEl = document.getElementById("skills");

    if (nameEl) nameEl.value = data.name || "";
    if (roleEl) roleEl.value = data.role || "";
    if (skillsEl) skillsEl.value = (data.skills || []).join(", ");
  }
});

/* ================= SAVE PROFILE (CREATE OR UPDATE) ================= */

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

  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        name: fullName,
        role,
        skills,
        profileCompleted: true,
        updatedAt: serverTimestamp()
      },
      { merge: true } // 🔥 THIS IS THE FIX
    );

    // Redirect to public profile
    window.location.href = `/profile-view.html?uid=${user.uid}`;

  } catch (err) {
    console.error("Profile save error:", err);
    alert("Failed to save profile. Please try again.");
  }
});
