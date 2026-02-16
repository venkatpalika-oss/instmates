/* =========================================================
   InstMates – Feed Guard (PHASE 2 – FINAL)
   File: assets/js/feed-guard.js
   Purpose:
   - Ensure feed is accessible only to logged-in users
   - Lightweight protection specific to feed page
========================================================= */

import { auth } from "./firebase.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Prevent back-button access
    window.location.replace("/login.html");
  }
});
