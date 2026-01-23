/* =========================================================
   InstMates - Header Auth UI (SAFE + RELIABLE)
========================================================= */

import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ================= WAIT FOR HEADER ================= */

function waitForHeader() {
  return new Promise(resolve => {
    const check = () => {
      const header = document.querySelector(".site-header");
      if (header) return resolve();
      setTimeout(check, 50);
    };
    check();
  });
}

/* ================= INIT HEADER AUTH ================= */

async function initHeaderAuth() {
  await waitForHeader();

  onAuthStateChanged(auth, (user) => {
    document.body.classList.add("auth-ready");

    const logoutBtn = document.getElementById("logoutBtn");
    const profileLink = document.getElementById("myProfileLink");

    if (user) {
      document.body.classList.add("logged-in");

      if (profileLink) {
        profileLink.href = `/profile-view.html?uid=${user.uid}`;
      }

      if (logoutBtn) {
        logoutBtn.onclick = async (e) => {
          e.preventDefault();
          await signOut(auth);
          window.location.href = "/index.html";
        };
      }

    } else {
      document.body.classList.remove("logged-in");
    }
  });
}

initHeaderAuth();
