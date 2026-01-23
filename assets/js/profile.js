/* =========================================================
   InstMates - Profile Setup Logic (STABLE & FINAL)
   File: assets/js/profile.js
========================================================= */

import { auth, db } from "./firebase.js";

import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* =========================================================
   WAIT FOR DOM (PREVENTS FLICKER / NULL ERRORS)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("profileForm");
  const nameEl = document.getElementById("fullName");
  const roleEl = document.getElementById("role");
  const skillsEl = document.getElementById("skills");

  /* ================= AUTH GUARD + LOAD PROFILE ================= */

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/login.html";
      return;
    }

    try {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) return;

      const data = snap.data();

      // 🔹 Autofill form (SAFE)
      if (nameEl) nameEl.value = data.name || "";
      if (roleEl) roleEl.value = data.role || "";
      if (skillsEl) skillsEl.value = (data.skills || []).join(", ");

    } catch (err) {
      console.error("Profile load error:", err);
    }
  });

  /* ================= SAVE PROFILE ================= */

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const user = auth.currentUser;
      if (!user) return;

      const fullName = nameEl.value.trim();
      const role = roleEl.value;
      const skillsInput = skillsEl.value;

      const skills = skillsInput
        ? skillsInput.split(",").map(s => s.trim()).filter(Boolean)
        : [];

      try {
        await updateDoc(doc(db, "users", user.uid), {
          name: fullName,
          role,
          skills,
          profileCompleted: true,
          updatedAt: serverTimestamp()
        });

        // ✅ Redirect ONLY after explicit save
        window.location.href = `/profile-view.html?uid=${user.uid}`;

      } catch (err) {
        console.error("Profile save error:", err);
        alert("Failed to save profile. Please try again.");
      }
    });
  }

});
