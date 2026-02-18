/* =========================================================
   InstMates – Technician Directory (ADVANCED)
   Clean URLs + Profile Image + Verification Badge
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

const listEl = document.getElementById("techniciansList");
const searchInput = document.getElementById("searchInput");

/* ================= AUTH ================= */

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("/login.html");
    return;
  }
  loadTechnicians();
});

/* ================= LOAD ================= */

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
      listEl.appendChild(renderCard(doc.id, doc.data()));
    });

  } catch (err) {
    console.error(err);
    listEl.innerHTML =
      `<p class="muted">Failed to load technicians.</p>`;
  }
}

/* ================= CARD ================= */

function renderCard(uid, p) {
  const card = document.createElement("div");
  card.className = "card";

  const skills = Array.isArray(p.skills)
    ? p.skills.join(", ")
    : "";

  const slug = createSlug(p.fullName || "technician");

  const profileURL = `/technicians/${slug}?id=${uid}`;

  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px">

      <img src="${p.photoURL || "/assets/img/default-avatar.png"}"
           alt="Profile"
           style="width:60px;height:60px;border-radius:50%;object-fit:cover">

      <div>
        <h3 style="margin:0">
          ${escapeHTML(p.fullName || "Technician")}
          ${
            p.verified
              ? `<span style="color:#0d6efd;font-size:14px">✔ Verified</span>`
              : ""
          }
        </h3>

        <p class="muted" style="margin:4px 0">
          ${escapeHTML(p.role || "Instrument Technician")}
        </p>

        <p class="muted" style="margin:0">
          📍 ${escapeHTML(p.location || "Location not specified")}
        </p>
      </div>
    </div>

    ${
      skills
        ? `<p class="muted" style="margin-top:10px">${escapeHTML(skills)}</p>`
        : ""
    }

    <div class="action-row" style="margin-top:12px">
      <a href="${profileURL}" class="btn btn-ghost">
        View Profile →
      </a>

      <a href="/message.html?uid=${uid}" class="btn btn-primary">
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

function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
