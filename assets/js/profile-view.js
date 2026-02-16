/* =========================================================
   InstMates – Profile View Logic (READ-ONLY)
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

onAuthStateChanged(auth, async (user) => {
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
      <h2>${escape(p.fullName)}</h2>

      <p class="muted">${escape(p.role)}</p>

      <p style="margin-top:12px;">
        ${escape(p.bio || "No bio provided.")}
      </p>

      <div style="margin-top:16px;">
        <strong>Skills</strong><br>
        ${(p.skills || [])
          .map(s => `<span class="tag">${escape(s)}</span>`)
          .join(" ")}
      </div>

      ${
        user.uid !== uid
          ? `
          <div style="margin-top:20px;">
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
