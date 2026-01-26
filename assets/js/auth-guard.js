/* =========================================================
   InstMates – Auth Guard (HARDENED)
   File: assets/js/auth-guard.js
   Purpose:
   - Enforce login on protected pages
   - Prevent access leaks via refresh / back button
   - Enforce profile-first onboarding
   - Redirect logged-in users away from auth pages
========================================================= */

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= PAGE CLASSIFICATION ================= */

// Pages that NEVER require login
const PUBLIC_PAGES = [
  "home",
  "login",
  "register",
  "forgot",
  "about",
  "knowledge"
];

// Pages that REQUIRE login
const PROTECTED_PAGES = [
  "feed",
  "explore",
  "community",
  "dashboard",
  "profile",
  "profile-edit",
  "inbox",
  "message",
  "technicians",
  "question",
  "submit-case"
];

/* ================= AUTH ENFORCEMENT ================= */

onAuthStateChanged(auth, async (user) => {
  const page = document.body.dataset.page;

  if (!page) {
    console.warn("AuthGuard: data-page attribute missing");
    return;
  }

  /* ---------- USER NOT LOGGED IN ---------- */
  if (!user) {
    if (PROTECTED_PAGES.includes(page)) {
      window.location.replace("/login.html");
    }
    return;
  }

  /* ---------- USER LOGGED IN ---------- */

  // Prevent logged-in users from accessing auth pages
  if (PUBLIC_PAGES.includes(page) && page !== "home") {
    window.location.replace("/feed.html");
    return;
  }

  // Profile-first enforcement
  try {
    const profileRef = doc(db, "profiles", user.uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      if (page !== "profile-edit") {
        window.location.replace("/profile-edit.html");
      }
      return;
    }

  } catch (err) {
    console.error("AuthGuard profile check failed:", err);
  }

  // User is fully authenticated and onboarded → allow page
});
