/* =========================================================
   InstMates – Profile View Logic (READ-ONLY – UPGRADED)
   File: assets/js/profile-view.js
========================================================= */

import { auth, db } from "./firebase.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const card = document.getElementById("profileCard");

const user = auth.currentUser;
  if (!user) return;

  const uid = new URLSearchParams(window.location.search).get("uid");

  if (!uid) {
    card.innerHTML = `<p class="muted">Profile not found.</p>`;
    return;
  }

  try {
    const snap = await getDoc(doc(db, "profiles", uid));

    if (!snap.exists()) {
      card.innerHTML = `<p class="muted">Profile not found.</p>`;
      return;
    }

    const p = snap.data();

    card.innerHTML = `
      <h2>${escape(p.fullName || "Technician")}</h2>

      <p class="muted">${escape(p.role || "")}</p>

      ${p.location ? `<p class="muted">📍 ${escape(p.location)}</p>` : ""}

      ${p.experienceYears
        ? `<p class="muted">🕒 ${escape(p.experienceYears)} years experience</p>`
        : ""
      }

      ${p.primaryDomain
        ? `<p class="muted">🔧 ${escape(p.primaryDomain)}</p>`
        : ""
      }

      ${
        Array.isArray(p.industriesWorked) && p.industriesWorked.length > 0
          ? `
          <div style="margin-top:16px;">
            <strong>Industries Worked</strong><br>
            ${p.industriesWorked
              .map(ind => `<span class="tag">${escape(ind)}</span>`)
              .join(" ")}
          </div>
          `
          : ""
      }

      ${
        p.summary
          ? `
          <div style="margin-top:20px;">
            <strong>Field Experience Summary</strong>
            <p style="margin-top:8px;">
              ${escape(p.summary)}
            </p>
          </div>
          `
          : ""
      }

      ${
        Array.isArray(p.skills) && p.skills.length > 0
          ? `
          <div style="margin-top:20px;">
            <strong>Core Skills</strong><br>
            ${p.skills
              .map(s => `<span class="tag">${escape(s)}</span>`)
              .join(" ")}
          </div>
          `
          : ""
      }

      ${
        Array.isArray(p.majorTroubleshooting) &&
        p.majorTroubleshooting.length > 0
          ? `
          <div style="margin-top:24px;">
            <strong>Major Troubleshooting & Breakthroughs</strong>
            ${p.majorTroubleshooting
              .map(item => `
                <div style="margin-top:12px; padding:12px; background:#f8fafc; border-radius:8px;">
                  ${item.system ? `<strong>${escape(item.system)}</strong><br>` : ""}
                  ${item.problem ? `<p><strong>Problem:</strong> ${escape(item.problem)}</p>` : ""}
                  ${item.action ? `<p><strong>Action:</strong> ${escape(item.action)}</p>` : ""}
                  ${item.outcome ? `<p><strong>Outcome:</strong> ${escape(item.outcome)}</p>` : ""}
                  ${item.impact ? `<p><strong>Impact:</strong> ${escape(item.impact)}</p>` : ""}
                </div>
              `)
              .join("")}
          </div>
          `
          : ""
      }

      ${
        user.uid !== uid
          ? `
          <div style="margin-top:24px;">
            <button id="startChatBtn" class="btn btn-primary full">
              💬 Message
            </button>
          </div>
        `
          : ""
      }
    `;

    // ================= START CHAT HANDLER =================
    const chatBtn = document.getElementById("startChatBtn");
    if (chatBtn) {
      chatBtn.addEventListener("click", () => {
        window.location.href = `/chat.html?uid=${uid}`;
      });
    }

  } catch (err) {
    console.error("Profile view error:", err);
    card.innerHTML = `<p class="muted">Failed to load profile.</p>`;
  }
});

/* ================= HELPERS ================= */

function escape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
