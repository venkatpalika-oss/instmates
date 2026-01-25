import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const grid = document.getElementById("profilesGrid");

async function loadProfiles() {
  if (!grid) return;

  try {
    const q = query(
      collection(db, "users"),
      where("publicProfile", "==", true),
      where("profileCompleted", "==", true),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      grid.innerHTML = `<p class="muted">No public profiles available.</p>`;
      return;
    }

    snap.forEach(doc => {
      const u = doc.data();

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${u.name}</h3>
        <p class="muted">${u.role}</p>
        <p class="muted">📍 ${u.location || ""}</p>

        <div class="tags">
          ${(u.skills || []).map(s => `<span class="tag">${s}</span>`).join("")}
        </div>
      `;

      grid.appendChild(card);
    });

  } catch (err) {
    console.error("Profile load failed:", err);
    grid.innerHTML = `<p class="muted">Failed to load profiles.</p>`;
  }
}

loadProfiles();
