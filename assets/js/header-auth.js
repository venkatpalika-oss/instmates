/* =========================================================
   InstMates - Header Auth State (UI ONLY)
   File: assets/js/header-auth.js
========================================================= */

import { auth } from "./firebase.js";
import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  // Mark auth resolved so header can render
  document.body.classList.add("auth-ready");

  if (user) {
    document.body.classList.add("logged-in");

    // Set My Profile link if present
    const link = document.getElementById("myProfileLink");
    if (link) {
      link.href = `/profile-view.html?uid=${user.uid}`;
    }
  } else {
    document.body.classList.remove("logged-in");
  }
});
