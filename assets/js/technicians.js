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

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const q = query(
    collection(db, "users"),
    where("profileCompleted", "==", true),
    where("publicProfile", "==", true)
  );

  const snap = await getDocs(q);
  listEl.innerHTML = "";

  snap.forEach(doc => {
    const u = doc.data();

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${u.name}</h3>
      <p class="muted">${u.role}</p>
      <p>${u.primaryDomain}</p>
      <p>${u.location}</p>
      <p class="muted">${u.experienceYears} years experience</p>
    `;

    listEl.appendChild(card);
  });
});
