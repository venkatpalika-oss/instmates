/* =========================================================
   InstMates – Technician Directory Logic (FINAL ADVANCED)
   File: assets/js/technicians.js

   PURPOSE:
   - Load ALL technician profiles
   - Show only completed profiles
   - No artificial limits
   - Dynamic profile linking
   - Auth protected
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

/* ================= ELEMENTS ================= */

// 🔥 FIXED ID to match your HTML
const listEl = document.getElementById("techniciansList");
const searchInput = document.getElementById("searchInput");

/* ================= AUTH GATE ================= */

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("/login.html");
    return;
  }
  loadTechnicians();
});

/* ================= LOAD TECHNICIANS ================= */

async function loadTechnicians() {
  if (!listEl) return;

  listEl.innerHTML = `<p class="muted">Loading technicians…</p>`;

  try {
    const q = query(
      collection(db, "profiles"),
      where("profileCompleted", "==", true)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      listEl.innerHTML = `<p class="muted">No technicians found.</p>`;
      return;
    }

    listEl.innerHTML = "";

    snap.forEach(doc => {
      const card = renderCard(doc.id, doc.data());
      listEl.appendChild(card);
    });

  } catch (err) {
    console.error("Failed to load technicians:", err);
    listEl.innerHTML =
      `<p class="muted">Failed to load technicians.</p>`;
  }
}

/* ================= RENDER CARD ================= */

function renderCard(uid, p) {
  const card = document.createElement("div");
  card.className = "card";

  const skills = Array.isArray(p.skills)
    ? p.skills.join(", ")
    : "";

  card.innerHTML = `
    <h3>${escapeHTML(p.fullName || "Technician")}</h3>

    <p class="muted">
      ${escapeHTML(p.role || "Instrument Technician")}
    </p>

    <p class="muted">
      📍 ${escapeHTML(p.location || "Location not specified")}
    </p>

    ${
      skills
        ? `<p class="muted">${escapeHTML(skills)}</p>`
        : ""
    }

    <div class="action-row" style="margin-top:10px">
      <a href="/technicians/profile.html?id=${uid}"
         class="btn btn-ghost">
        View Profile →
      </a>

      <a href="/message.html?uid=${uid}"
         class="btn btn-primary">
        Message
      </a>
    </div>
  `;

  return card;
}

/* ================= SEARCH ================= */

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    const cards = listEl.querySelectorAll(".card");

    cards.forEach(card => {
      card.style.display =
        card.innerText.toLowerCase().includes(term)
          ? "block"
          : "none";
    });
  });
}

/* ================= HELPERS ================= */

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
