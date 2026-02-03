/* =========================================================
   InstMates – Technician Directory
   Source: users collection (PUBLIC + COMPLETED profiles only)
========================================================= */

import { auth, db } from "./firebase.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const listEl = document.getElementById("technicianList");
const searchInput = document.getElementById("searchInput");

let technicians = [];

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  await loadTechnicians();
  renderList(technicians);
});

/* ================= LOAD ================= */

async function loadTechnicians() {
  const q = query(
    collection(db, "users"),
    where("profileCompleted", "==", true),
    where("publicProfile", "==", true)
  );

  const snap = await getDocs(q);
  technicians = [];

  snap.forEach(doc => technicians.push(doc.data()));
}

/* ================= RENDER ================= */

function renderList(data) {
  listEl.innerHTML = "";

  if (!data.length) {
    listEl.innerHTML = `<p class="muted">No technicians found.</p>`;
    return;
  }

  data.forEach(t => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${t.name || "Technician"}</h3>
      <p class="muted">${t.role || "Technician"}</p>

      <p><strong>Domain:</strong> ${t.primaryDomain || "—"}</p>
      <p><strong>Location:</strong> ${t.location || "—"}</p>
      <p class="muted">${t.experienceYears || 0} years experience</p>

      <a class="btn btn-soft"
         href="/profile-view.html?uid=${t.uid}">
        View Profile →
      </a>
    `;

    listEl.appendChild(card);
  });
}

/* ================= SEARCH ================= */

searchInput?.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase().trim();

  const filtered = technicians.filter(t =>
    `${t.name} ${t.primaryDomain} ${t.location}`
      .toLowerCase()
      .includes(q)
  );

  renderList(filtered);
});
