/* =========================================================
   InstMates – Technicians Directory (FINAL)
   File: assets/js/technicians.js
   PURPOSE:
   - Show ALL technicians
   - Hide only those who explicitly set publicProfile = false
========================================================= */

import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= ELEMENT ================= */

const listEl = document.getElementById("techniciansList");

/* ================= LOAD TECHNICIANS ================= */

async function loadTechnicians() {

  if (!listEl) return;

  listEl.innerHTML = `<p class="muted">Loading technicians…</p>`;

  const q = query(
    collection(db, "profiles"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  listEl.innerHTML = "";

  if (snap.empty) {
    listEl.innerHTML = `<p class="muted">No technicians found.</p>`;
    return;
  }

  snap.forEach(docSnap => {
    const p = docSnap.data();

    // ✅ CRITICAL FIX
    // Show profile if publicProfile is TRUE or MISSING
    if (p.publicProfile === false) return;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${escapeHTML(p.fullName || "Technician")}</h3>

      <p class="muted">
        ${escapeHTML(p.role || "Instrument / Analyzer Technician")}
      </p>

      ${p.primaryDomain
        ? `<p class="muted">🧪 ${escapeHTML(p.primaryDomain)}</p>`
        : ""
      }

      ${p.location
        ? `<p class="muted">📍 ${escapeHTML(p.location)}</p>`
        : ""
      }

      <div style="margin-top:10px">
        <a class="btn btn-soft"
           href="/profile-view.html?uid=${docSnap.id}">
          View Profile
        </a>

        <a class="btn btn-ghost"
           href="/message.html?uid=${docSnap.id}">
          Message
        </a>
      </div>
    `;

    listEl.appendChild(card);
  });
}

/* ================= HELPERS ================= */

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ================= INIT ================= */

loadTechnicians();
