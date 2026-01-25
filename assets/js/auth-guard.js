/* =========================================================
   InstMates – Auth Guard (GLOBAL)
   File: assets/js/auth-guard.js
   Purpose:
   - Block protected pages for logged-out users
   - Redirect logged-in users away from home/login/register
========================================================= */

import { auth } from "./firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const PUBLIC_PAGES = [
  "home",
  "login",
  "register"
];

onAuthStateChanged(auth, (user) => {
  const page = document.body.dataset.page;

  // If NOT logged in
  if (!user) {
    if (!PUBLIC_PAGES.includes(page)) {
      window.location.href = "/login.html";
    }
    return;
  }

  // If logged in
  if (PUBLIC_PAGES.includes(page)) {
    window.location.href = "/explore.html";
  }
});
