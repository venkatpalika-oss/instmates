/* =========================================================
   InstMates – Technician Directory (public listing)
   W0.1/W0.3 hardening:
   - every user field goes through /assets/js/safe-html.js
     (the previous version put photoURL and uid into markup raw)
   - photo URLs must be Firebase Storage URLs
   - the query asks Firestore for PUBLIC profiles only, so the
     rules (not this file) decide what is visible
========================================================= */

import { auth, db } from "./firebase.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { esc, safeStorageUrl, idParam } from "./safe-html.js";

/* ================= ELEMENTS ================= */

const listEl = document.getElementById("techniciansList");
const searchInput = document.getElementById("searchInput");

/* ================= AUTH ================= */

// Directory is public - no login required to view
onAuthStateChanged(auth, () => {
   loadTechnicians();
});

/* ================= LOAD ALL ================= */

async function loadTechnicians() {
  if (!listEl) return;

  listEl.innerHTML = `<p class="muted">Loading technicians…</p>`;

  try {

    // Rules only allow listing profiles whose profileStatus.isPublic == true.
    const snap = await getDocs(
      query(collection(db, "profiles"), where("profileStatus.isPublic", "==", true))
    );

    if (snap.empty) {
      listEl.innerHTML = `<p class="muted">No technicians found.</p>`;
      return;
    }

    listEl.innerHTML = "";

    snap.forEach(doc => {
      listEl.appendChild(renderCard(doc.id, doc.data() || {}));
    });

  } catch (err) {
    console.error(err);
    listEl.innerHTML =
      `<p class="muted">Failed to load technicians.</p>`;
  }
}

/* ================= CARD ================= */

function str(value, max = 200) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function renderCard(uid, p) {

  const card = document.createElement("div");
  card.className = "card";

  const basic = p.basicInfo || {};
  const professional = p.professional || {};

  // Support both the nested (current) and flat (legacy) schemas.
  const fullName = str(basic.fullName, 100) || str(p.fullName, 100) || "Technician";
  const role = str(basic.headline, 150) || str(p.role, 150) || "Instrument Technician";
  const location = str(basic.location, 100) || str(p.location, 100) || "Location not specified";
  const skillList = Array.isArray(professional.analyzersWorked) && professional.analyzersWorked.length
    ? professional.analyzersWorked
    : (Array.isArray(p.skills) ? p.skills : []);
  const skills = skillList.filter(s => typeof s === "string").slice(0, 20).map(s => s.slice(0, 60)).join(", ");
  const photo = safeStorageUrl(basic.profilePhoto || p.photoURL, "");
  const safeUID = idParam(uid);

  const profileURL = `/profile/?uid=${safeUID}`;

  const avatarHTML = photo
    ? `<img src="${esc(photo)}" alt=""
           style="width:60px;height:60px;border-radius:50%;object-fit:cover">`
    : `<div aria-hidden="true"
           style="width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#e7eef5;font-weight:700;color:#0b3c5d">
         ${esc(fullName.trim().charAt(0).toUpperCase() || "T")}
       </div>`;

  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px">

      ${avatarHTML}

      <div>
        <h3 style="margin:0">
          ${esc(fullName)}
          ${
            (p.isVerified === true || p.verified === true)
              ? `<span style="color:#0d6efd;font-size:14px;margin-left:6px">✔ Verified</span>`
              : ""
          }
        </h3>

        <p class="muted" style="margin:4px 0">
          ${esc(role)}
        </p>

        <p class="muted" style="margin:0">
          📍 ${esc(location)}
        </p>
      </div>
    </div>

    ${
      skills
        ? `<p class="muted" style="margin-top:10px">${esc(skills)}</p>`
        : ""
    }

    <div class="action-row" style="margin-top:12px">
      <a href="${profileURL}" class="btn btn-ghost">
        View Profile →
      </a>

      <!-- W0: "Message" button hidden - messaging is not functional
           (message.html script fails to load; no Firestore rules). -->
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
