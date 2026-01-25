/* =========================================================
   InstMates - Header Auth UI (SAFE + RELIABLE)
========================================================= */

import { auth } from "./firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {

  // Elements
  const loggedInNav = document.querySelectorAll(".nav-auth");
  const loggedOutNav = document.querySelectorAll(".nav-guest");

  if (user) {
    // Logged IN
    loggedInNav.forEach(el => el.style.display = "inline-flex");
    loggedOutNav.forEach(el => el.style.display = "none");
    document.body.classList.add("auth-in");
    document.body.classList.remove("auth-out");
  } else {
    // Logged OUT
    loggedInNav.forEach(el => el.style.display = "none");
    loggedOutNav.forEach(el => el.style.display = "inline-flex");
    document.body.classList.add("auth-out");
    document.body.classList.remove("auth-in");
  }
});


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
