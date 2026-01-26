/* =========================================================
   InstMates – Profile Logic (PHASE 2 – FINAL, CLEAN)
   File: assets/js/profile.js
========================================================= */

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */

const form = document.getElementById("profileForm");

/* ================= LOAD PROFILE ================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("/login.html");
    return;
  }

  try {
    const ref = doc(db, "profiles", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();

    setVal("fullName", data.fullName);
    setVal("role", data.role);
    setVal("bio", data.bio);
    setVal("skills", (data.skills || []).join(", "));

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

    const profile = {
      uid: user.uid,
      fullName: val("fullName"),
      role: val("role"),
      bio: val("bio"),
      skills: split("skills"),
      profileCompleted: true,
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          ...profile,
          createdAt: serverTimestamp()
        },
        { merge: true }
      );

      alert("Profile saved successfully");
      window.location.replace("/feed.html");

    } catch (err) {
      console.error("Profile save error:", err);
      alert("Failed to save profile. Please try again.");
    }
  });
}

/* ================= HELPERS ================= */

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function split(id) {
  const v = val(id);
  return v
    ? v.split(",").map(s => s.trim()).filter(Boolean)
    : [];
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined) {
    el.value = value;
  }
}
