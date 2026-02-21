/* =========================================================
   InstMates – Profile Logic (PHASE 3 – NESTED SCHEMA SAFE)
   File: assets/js/profile.js
   Compatible with FINAL nested Firestore structure
   Does NOT break existing architecture
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

const user = auth.currentUser;
  if (!user) {
    window.location.replace("/login.html");
    return;
  }

  try {
    const ref = doc(db, "profiles", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();

    /* ================= BASIC INFO ================= */

    setVal("fullName", data.basicInfo?.fullName);
    setVal("role", data.basicInfo?.headline);
    setVal("location", data.basicInfo?.location);
    setVal("experienceYears", data.basicInfo?.experienceYears);

    /* ================= PROFESSIONAL ================= */

    setVal("primaryDomain", data.professional?.specialization);

    // Convert array to comma string for UI
    setVal("skills",
      (data.professional?.analyzersWorked || []).join(", ")
    );

    /* ================= INDUSTRIES ================= */

    const industriesSelect = document.getElementById("industries");
    if (industriesSelect && data.professional?.plantType) {
      Array.from(industriesSelect.options).forEach(option => {
        option.selected =
          option.value === data.professional.plantType;
      });
    }

    /* ================= ACHIEVEMENT ================= */

    if (data.achievement) {
      addTroubleBlock();
      const lastCard = document.querySelectorAll(".trouble-card");
      const card = lastCard[lastCard.length - 1];

      card.querySelector("[data-field='title']").value =
        data.achievement.title || "";

      card.querySelector("[data-field='description']").value =
        data.achievement.description || "";

      card.querySelector("[data-field='impact']").value =
        data.achievement.impact || "";
    }

    /* ================= PROFILE STATUS ================= */

    if (publicProfileCheckbox) {
      publicProfileCheckbox.checked =
        data.profileStatus?.isPublic !== false;
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

    /* ================= COLLECT INDUSTRIES ================= */

    const industriesSelect = document.getElementById("industries");
    const plantType = industriesSelect
      ? industriesSelect.value
      : "";

    /* ================= COLLECT ACHIEVEMENT ================= */

    let achievement = {
      title: "",
      description: "",
      impact: ""
    };

    const troubleCard = document.querySelector(".trouble-card");
    if (troubleCard) {
      troubleCard.querySelectorAll("[data-field]").forEach(field => {
        achievement[field.dataset.field] =
          field.value.trim();
      });
    }

    /* ================= BUILD FINAL STRUCTURE ================= */

    const profile = {
      basicInfo: {
        fullName: val("fullName"),
        headline: val("role"),
        company: "", // kept for future use
        experienceYears: Number(val("experienceYears")) || 0,
        location: val("location"),
        profilePhoto: ""
      },

      professional: {
        specialization: val("primaryDomain"),
        plantType: plantType,
        analyzersWorked: split("skills"),
        certifications: []
      },

      achievement: achievement,

      profileStatus: {
        completionPercent: 100,
        isPublic: publicProfileCheckbox
          ? publicProfileCheckbox.checked
          : true,
        lastUpdated: serverTimestamp()
      },

      createdAt: serverTimestamp()
    };

    try {
      /* ================= SAVE PROFILE ================= */

      await setDoc(
        doc(db, "profiles", user.uid),
        profile,
        { merge: true }
      );

      /* ================= UPDATE USERS COLLECTION ================= */

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