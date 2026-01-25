/* =========================================================
   InstMates – Header Auth UI (FINAL, SINGLE SOURCE)
========================================================= */

import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {

  // Reset state
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

});
