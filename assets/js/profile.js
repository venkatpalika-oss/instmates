import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, updateDoc, getDoc, serverTimestamp } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= COMPLETENESS CALCULATOR ================= */

function calculateCompletion(data) {
  let score = 0;

  if (data.name) score += 15;
  if (data.role) score += 15;
  if (data.experienceYears) score += 10;
  if (data.primaryDomain) score += 15;
  if (data.skills?.length) score += 20;
  if (data.industries?.length) score += 10;
  if (data.summary) score += 15;

  return Math.min(score, 100);
}

function updateProgress(percent) {
  document.getElementById("profilePercent").innerText = percent;
  document.getElementById("profileBar").style.width = percent + "%";
}

/* ================= LOAD PROFILE ================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();

  // Autofill
  fullName.value = data.name || "";
  role.value = data.role || "";
  location.value = data.location || "";
  experienceYears.value = data.experienceYears || "";
  primaryDomain.value = data.primaryDomain || "";
  skills.value = (data.skills || []).join(", ");
  summary.value = data.summary || "";

  if (data.industries) {
    [...industries.options].forEach(o => {
      o.selected = data.industries.includes(o.value);
    });
  }

  updateProgress(calculateCompletion(data));
});

/* ================= SAVE PROFILE ================= */

document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return;

  const payload = {
    name: fullName.value.trim(),
    role: role.value,
    location: location.value.trim(),
    experienceYears: Number(experienceYears.value || 0),
    primaryDomain: primaryDomain.value,
    skills: skills.value.split(",").map(s => s.trim()).filter(Boolean),
    industries: [...industries.selectedOptions].map(o => o.value),
    summary: summary.value.trim(),
    updatedAt: serverTimestamp()
  };

  payload.profileCompleted = calculateCompletion(payload) >= 60;

  await updateDoc(doc(db, "users", user.uid), payload);

  window.location.href = `/profile-view.html?uid=${user.uid}`;
});
