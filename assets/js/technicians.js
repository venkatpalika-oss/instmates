/* =========================================================
   InstMates – Technician Directory Logic (FINAL FIX)
   File: assets/js/technicians.js
========================================================= */

import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= ELEMENTS ================= */

const listEl = document.getElementById("techniciansList");
const searchInput = document.getElementById("searchInput");

/* ================= LOAD TECHNICIANS ================= */

async function loadTechnicians() {
  if (!listEl) return;

  listEl.innerHTML = `<p class="muted">Loading technicians…</p>`;

  const snap = await getDocs(collection(db, "profiles"));
  listEl.innerHTML = "";

  if (snap.empty) {
    listEl.innerHTML = `<p class="muted">No technicians found.</p>`;
    return;
  }

  let count = 0;

  snap.forEach(docSnap => {
    const p = docSnap.data();

    // ✅ SHOW IF:
    // - publicProfile === true
    // - OR publicProfile is missing (legacy profiles)
    if (p.publicProfile === false) return;

    count++;
    listEl.appendChild(renderCard(docSnap.id, p));
  });

  if (count === 0) {
    listEl.innerHTML = `<p class="muted">No public profiles available.</p>`;
  }
}

/* ================= RENDER CARD ================= */

function renderCard(uid, p) {
  const div = document.createElement("div");
  div.className = "card";

  div.innerHTML = `
    <h3>${p.fullName || "Unnamed Technician"}</h3>
    <p class="muted">${p.role || "Technician"}</p>

    ${p.location ? `<p>📍 ${p.location}</p>` : ""}
    ${p.primaryDomain ? `<p>${p.primaryDomain}</p>` : ""}
    ${p.skills?.length ? `<p class="muted">${p.skills.join(", ")}</p>` : ""}

    <a href="/message.html?uid=${uid}" class="btn btn-primary">
      Message
    </a>
  `;

  return div;
}

/* ================= SEARCH ================= */

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();
    document.querySelectorAll("#techniciansList .card").forEach(card => {
      card.style.display =
        card.innerText.toLowerCase().includes(q)
          ? "block"
          : "none";
    });
  });
}

/* ================= INIT ================= */

loadTechnicians();
