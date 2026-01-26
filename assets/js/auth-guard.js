/* =========================================================
   InstMates – Auth Guard (PHASE 2 – FINAL)
   File: assets/js/auth-guard.js
========================================================= */

import { auth, db } from "./firebase.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const PUBLIC_PAGES = [
  "home",
  "login",
  "register"
];

onAuthStateChanged(auth, async (user) => {
  const page = document.body.dataset.page;

  // ================= NOT LOGGED IN =================
  if (!user) {
    if (!PUBLIC_PAGES.includes(page)) {
      window.location.replace("/login.html");
    }
    return;
  }

  // ================= LOGGED IN =================
  try {
    const ref = doc(db, "profiles", user.uid);
    const snap = await getDoc(ref);

    const profileCompleted =
      snap.exists() && snap.data().profileCompleted === true;

    // 🚫 Block access until profile is completed
    if (!profileCompleted && page !== "profile-edit") {
      window.location.replace("/profile-edit.html");
      return;
    }

    // 🚫 Prevent going back to login/register
    if (PUBLIC_PAGES.includes(page)) {
      window.location.replace("/feed.html");
      return;
    }

  } catch (err) {
    console.error("Auth guard profile check failed:", err);
  }
});
