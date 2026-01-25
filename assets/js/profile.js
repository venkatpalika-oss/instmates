/* =========================================================
   InstMates - Profile Setup Logic (FINAL + STABLE)
   File: assets/js/profile.js
========================================================= */

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */

const form = document.getElementById("profileForm");
const progressBar = document.getElementById("profileProgress");

/* ================= AUTH + LOAD ================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const d = snap.data();

  // Autofill base fields
  setVal("fullName", d.name);
  setVal("role", d.role);
  setVal("location", d.location);
  setVal("experienceYears", d.experienceYears);
  setVal("primaryDomain", d.primaryDomain);
  setVal("skills", (d.skills || []).join(", "));
  setVal("summary", d.summary);

  // Autofill troubleshooting blocks
  if (Array.isArray(d.majorTroubleshooting)) {
    d.majorTroubleshooting.forEach(t => addTroubleBlock(t));
  }

  if (progressBar) {
    progressBar.style.width = `${d.profileCompletion || 0}%`;
  }
});

/* ================= SAVE PROFILE ================= */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return;

  const troubleshooting = collectTroubleshooting();

  const data = {
    uid: user.uid,                        // ✅ explicit UID
    name: val("fullName"),
    role: val("role"),
    location: val("location"),
    experienceYears: num("experienceYears"),
    primaryDomain: val("primaryDomain"),
    skills: split("skills"),
    industries: getMulti("industries"),
    summary: val("summary"),
    majorTroubleshooting: troubleshooting,

    // ✅ PUBLIC PROFILE FLAG (CRITICAL)
    publicProfile: true,

    updatedAt: serverTimestamp()
  };

  const completion = calculateCompletion(data);
  data.profileCompletion = completion;
  data.profileCompleted = completion >= 70;

  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        ...data,

        // ✅ ensure this exists for listing & ordering
        createdAt: serverTimestamp()
      },
      { merge: true }
    );

    if (progressBar) {
      progressBar.style.width = `${completion}%`;
    }

    alert("Profile saved successfully");

    if (data.profileCompleted) {
      window.location.href = `/profile-view.html?uid=${user.uid}`;
    }

  } catch (err) {
    console.error("Profile save error:", err);
    alert("Failed to save profile. Please try again.");
  }
});

/* ================= TROUBLESHOOTING ================= */

function collectTroubleshooting() {
  const blocks = document.querySelectorAll(".trouble-card");
  const list = [];

  blocks.forEach(b => {
    const item = {};
    b.querySelectorAll("[data-field]").forEach(el => {
      item[el.dataset.field] = el.value.trim();
    });

    if (item.system || item.problem || item.action) {
      list.push(item);
    }
  });

  return list;
}

function addTroubleBlock(data = {}) {
  const tpl = document.getElementById("troubleTemplate");
  if (!tpl) return;

  const clone = tpl.content.cloneNode(true);
  clone.querySelectorAll("[data-field]").forEach(el => {
    el.value = data[el.dataset.field] || "";
  });

  document.getElementById("troubleshootingList")
    ?.appendChild(clone);
}

/* ================= HELPERS ================= */

function val(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function num(id) {
  const v = parseInt(val(id), 10);
  return isNaN(v) ? null : v;
}

function split(id) {
  const v = val(id);
  return v ? v.split(",").map(s => s.trim()).filter(Boolean) : [];
}

function getMulti(id) {
  const el = document.getElementById(id);
  if (!el) return [];
  return Array.from(el.selectedOptions).map(o => o.value);
}

function setVal(id, v) {
  const el = document.getElementById(id);
  if (el && v !== undefined) el.value = v;
}

/* ================= COMPLETION LOGIC ================= */

function calculateCompletion(d) {
  let score = 0;
  if (d.name) score += 15;
  if (d.role) score += 15;
  if (d.location) score += 10;
  if (d.experienceYears) score += 10;
  if (d.primaryDomain) score += 15;
  if (d.skills?.length) score += 15;
  if (d.industries?.length) score += 10;
  if (d.summary) score += 5;
  if (d.majorTroubleshooting?.length) score += 5;
  return score;
}
