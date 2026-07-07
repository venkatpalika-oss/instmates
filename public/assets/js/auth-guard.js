/* =========================================================
InstMates - Auth Guard (FINAL - STABLE VERSION)
File: assets/js/auth-guard.js
========================================================= */

import { auth, db } from "./firebase.js";
import { onAuthStateChanged }
   from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
   doc,
   getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Pages that still require login (posting, commenting, and personal features).
// Every other page is viewable without logging in.
const PRIVATE_PAGES = [
   "dashboard",
   "inbox",
   "message",
   "chat",
   "ask",
   "submit-case"
   ];

// Pages a logged-in user should be redirected away from
const REDIRECT_IF_LOGGED_IN = [
   "home",
   "login",
   "register"
   ];

onAuthStateChanged(auth, async (user) => {

                   const page = document.body.dataset.page;

                   // ================= NOT LOGGED IN =================
                   if (!user) {
                      if (PRIVATE_PAGES.includes(page)) {
                         window.location.replace("/login/");
                      }
                      return;
                   }

                   // ================= LOGGED IN =================
                   try {

   // CHECK PROFILE STATUS FROM USERS COLLECTION
   const userRef = doc(db, "users", user.uid);
                      const userSnap = await getDoc(userRef);

   const profileCompleted =
      userSnap.exists() &&
      userSnap.data().profileCompleted === true;

   // Block access until profile is completed
   if (!profileCompleted && page !== "profile") {
      window.location.replace(`/profile/?uid=${user.uid}`);
      return;
   }

   // Prevent going back to login/register after login
   if (REDIRECT_IF_LOGGED_IN.includes(page)) {
      window.location.replace("/feed/");
      return;
   }

                   } catch (err) {
                      console.error("Auth guard profile check failed:", err);
                   }

});
