/* =========================================================
   InstMates – Header Auth UI
   FINAL, HARDENED, NO FLICKER + DROPDOWN
   File: assets/js/header-auth.js
========================================================= */

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* =========================================================
   WAIT FOR HEADER INCLUDE
========================================================= */
function waitForHeader() {
  return new Promise((resolve) => {
    const check = () => {
      if (document.querySelector(".siteHeader")) {
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });
}

/* =========================================================
   MAIN INIT
========================================================= */
(async () => {
  await waitForHeader();

  // Hide header actions until auth resolves (extra safety)
  document.body.classList.remove("auth-ready", "auth-in", "auth-out");

  onAuthStateChanged(auth, async (user) => {

    // Reset auth state
    document.body.classList.remove("auth-in", "auth-out");

    if (user) {
      /* ================= LOGGED IN ================= */
      document.body.classList.add("auth-in");

      const profileLink = document.getElementById("myProfileLink");
      const logoutBtn   = document.getElementById("logoutBtn");

      if (profileLink) {
        profileLink.href = `/profile-view.html?uid=${user.uid}`;
      } else {
        console.warn("HeaderAuth: #myProfileLink not found");
      }

      if (logoutBtn) {
        logoutBtn.onclick = async (e) => {
          e.preventDefault();
          try {
            await signOut(auth);
            window.location.replace("/index.html");
          } catch (err) {
            console.error("Logout failed:", err);
          }
        };
      } else {
        console.warn("HeaderAuth: #logoutBtn not found");
      }

    } else {
      /* ================= LOGGED OUT ================= */
      document.body.classList.add("auth-out");
    }

    // 🔑 CRITICAL: mark auth as resolved (prevents flicker)
    document.body.classList.add("auth-ready");

    // After auth is resolved, wire dropdown
    initUserDropdown();
  });
})();

/* =========================================================
   USER DROPDOWN LOGIC (ACCOUNT ▾)
   – no color / logo impact
========================================================= */
function initUserDropdown() {
  const userMenu = document.querySelector(".user-menu");
  const userBtn  = document.getElementById("userMenuBtn");

  if (!userMenu || !userBtn) return;

  // Toggle dropdown on click
  userBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    userMenu.classList.toggle("open");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", () => {
    userMenu.classList.remove("open");
  });
}
