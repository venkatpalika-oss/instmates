/* =========================================================
   InstMates – Header Auth UI (FINAL, RACE-SAFE, NO FLICKER)
========================================================= */

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* Wait until header HTML is injected */
function waitForHeader() {
  return new Promise((resolve) => {
    const check = () => {
      if (document.querySelector(".site-header")) {
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });
}

(async () => {
  await waitForHeader();

  onAuthStateChanged(auth, (user) => {

    // Reset auth state
    document.body.classList.remove("auth-in", "auth-out");

    if (user) {
      // LOGGED IN
      document.body.classList.add("auth-in");

      const profileLink = document.getElementById("myProfileLink");
      const logoutBtn   = document.getElementById("logoutBtn");

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
      // LOGGED OUT
      document.body.classList.add("auth-out");
    }

    // 🔑 CRITICAL: mark auth as resolved (prevents flicker)
    document.body.classList.add("auth-ready");

  });
})();
