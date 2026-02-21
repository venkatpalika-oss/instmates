/* =========================================================
   InstMates – Auth Guard (FINAL – STABLE VERSION)
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

const user = auth.currentUser;

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

    // 🔥 CHECK PROFILE STATUS FROM USERS COLLECTION (CORRECT SOURCE)
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    const profileCompleted =
      userSnap.exists() &&
      userSnap.data().profileCompleted === true;

    // 🚫 Block access until profile is completed
    if (!profileCompleted && page !== "profile") {
      window.location.replace("//profile/");
      return;
    }

    // 🚫 Prevent going back to login/register after login
    if (PUBLIC_PAGES.includes(page)) {
      window.location.replace("/feed/");
      return;
    }

  } catch (err) {
    console.error("Auth guard profile check failed:", err);
  }

});
