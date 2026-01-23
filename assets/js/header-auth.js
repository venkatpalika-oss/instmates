/* =========================================================
   InstMates - Header Auth UI Logic
   File: assets/js/header-auth.js
========================================================= */

import { auth } from "./firebase.js";
import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  const link = document.getElementById("myProfileLink");
  if (link) {
    link.href = `/profile-view.html?uid=${user.uid}`;
  }
});
