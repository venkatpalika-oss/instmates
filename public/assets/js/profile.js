/* =========================================================
   InstMates – Profile Logic (PHASE 2 – FINAL, CLEAN)
   File: assets/js/profile.js
========================================================= */

import { auth, db } from "./firebase.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */

const form = document.getElementById("profileForm");
const publicProfileCheckbox =
  document.getElementById("publicProfile");

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
    setVal("location", data.location);
    setVal("experienceYears", data.experienceYears);
    setVal("primaryDomain", data.primaryDomain);
    setVal("summary", data.summary);
    setVal("skills", (data.skills || []).join(", "));

    // Load industries (multi-select)
    const industriesSelect = document.getElementById("industries");
    if (industriesSelect && data.industriesWorked) {
      Array.from(industriesSelect.options).forEach(option => {
        option.selected = data.industriesWorked.includes(option.value);
      });
    }

    // Load troubleshooting blocks
    if (data.majorTroubleshooting && Array.isArray(data.majorTroubleshooting)) {
      data.majorTroubleshooting.forEach(item => {
        addTroubleBlock();
        const lastCard = document.querySelectorAll(".trouble-card");
        const card = lastCard[lastCard.length - 1];
        card.querySelectorAll("[data-field]").forEach(field => {
          field.value = item[field.dataset.field] || "";
        });
      });
    }

    // Public profile flag
    if (publicProfileCheckbox) {
      publicProfileCheckbox.checked =
        data.publicProfile !== false;
    }

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

    // Collect industries
    const industriesSelect = document.getElementById("industries");
    const industries = industriesSelect
      ? Array.from(industriesSelect.selectedOptions).map(o => o.value)
      : [];

    // Collect troubleshooting entries
    const troubles = [];
    document.querySelectorAll(".trouble-card").forEach(card => {
      const obj = {};
      card.querySelectorAll("[data-field]").forEach(field => {
        obj[field.dataset.field] = field.value.trim();
      });
      troubles.push(obj);
    });

    const profile = {
      uid: user.uid,
      fullName: val("fullName"),
      role: val("role"),
      location: val("location"),
      experienceYears: val("experienceYears"),
      primaryDomain: val("primaryDomain"),
      industriesWorked: industries,
      summary: val("summary"),
      skills: split("skills"),
      majorTroubleshooting: troubles,
      publicProfile: publicProfileCheckbox
        ? publicProfileCheckbox.checked
        : true,
      profileCompleted: true,
      updatedAt: serverTimestamp()
    };

    try {
      // Save profile collection
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          ...profile,
          createdAt: serverTimestamp()
        },
        { merge: true }
      );

      // Update users collection (CRITICAL)
      await updateDoc(
        doc(db, "users", user.uid),
        {
          profileCompleted: true,
          updatedAt: serverTimestamp()
        }
      );

      alert("Profile saved successfully");
      window.location.replace("/feed/");

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
