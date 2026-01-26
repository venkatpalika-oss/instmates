/* =========================================================
   InstMates – Profile Logic (PHASE 2 – FINAL)
   File: assets/js/profile.js
========================================================= */

import { auth, db } from "./firebase.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */

const form = document.getElementById("profileForm");

/* ================= AUTH + LOAD PROFILE ================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("/login.html");
    return;
  }

  try {
    const ref = doc(db, "profiles", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const d = snap.data();

    setVal("fullName", d.fullName);
    setVal("role", d.role);
    setVal("bio", d.bio);
    setVal("skills", (d.skills || []).join(", "));

  } catch (err) {
    console.error("Profile load failed:", err);
  }
});

/* ================= SAVE PROFILE ================= */

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return;

  const data = {
    uid: user.uid,
    fullName: val("fullName"),
    role: val("role"),
    bio: val("bio"),
    skills: split("skills"),
    updatedAt: serverTimestamp()
  };

  // basic completion rule (Phase 2)
  const completed =
    data.fullName &&
    data.role &&
    data.bio &&
    data.skills.length > 0;

  data.profileCompleted = completed;

  try {
    await setDoc(
      doc(db, "profiles", user.uid),
      {
        ...data,
        createdAt: serverTimestamp()
      },
      { merge: true }
    );

    alert("Profile saved successfully");

    // Let auth-guard decide access, but help UX
    if (completed) {
      window.location.replace("/feed.html");
    }

  } catch (err) {
    console.error("Profile save failed:", err);
    alert("Failed to save profile. Please try again.");
  }
});

/* ================= HELPER*
