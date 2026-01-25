/* =========================================================
   InstMates - Firebase Authentication (FINAL)
   File: assets/js/auth.js
   SDK: Firebase v9 (Modular)
   NOTE:
   - Firebase app is initialized ONLY ONCE in firebase.js
   - This file contains auth + firestore logic only
   - Enforces profile-first onboarding (Option A)
   - SITE IS SIGNUP-FIRST (ONLY index.html is public)
========================================================= */

/* ================= IMPORT SHARED FIREBASE ================= */

import { auth, db } from "./firebase.js";

/* ================= AUTH IMPORTS ================= */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ================= FIRESTORE IMPORTS ================= */

import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* =========================================================
   REGISTER (PROFILE-FIRST — REQUIRED)
========================================================= */

window.registerUser = async function (email, password, fullName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    name: fullName,
    email: email,
    role: "user",
    verified: false,
    profileCompleted: false,
    createdAt: serverTimestamp()
  });

  window.location.href = "/profile.html";
  return cred;
};

/* ================= LOGIN ================= */

window.loginUser = async function (email, password) {
  return signInWithEmailAndPassword(auth, email, password);
};

/* ================= LOGOUT ================= */

window.logoutUser = async function () {
  await signOut(auth);
  window.location.href = "/index.html";
};

/* =========================================================
   AUTH STATE HANDLER (SIGNUP-FIRST — FINAL)
========================================================= */

onAuthStateChanged(auth, async (user) => {
  // Prevent header flicker
  document.body.classList.add("auth-ready");

  const path = location.pathname;

  /* ================= PUBLIC PAGES (ONLY LANDING) ================= */
  const publicPages = [
    "/",                 // root domain
    "/index.html"        // signup / login landing
  ];

  /* ================= NOT LOGGED IN ================= */
  if (!user) {
    document.body.classList.remove("logged-in");

    // If NOT on a public page → force to index
    if (!publicPages.includes(path)) {
      window.location.replace("/index.html");
    }
    return;
  }

  /* ================= LOGGED IN ================= */
  document.body.classList.add("logged-in");

  try {
    const snap = await getDoc(doc(db, "users", user.uid));

    // User record missing → force profile creation
    if (!snap.exists()) {
      if (path !== "/profile.html") {
        window.location.replace("/profile.html");
      }
      return;
    }

    const data = snap.data();

    /* ================= PROTECTED APP PAGES ================= */
    const protectedPages = [
      "/explore.html",
      "/community.html",
      "/post.html"
    ];

    /* ===== PROFILE NOT COMPLETED ===== */
    if (!data.profileCompleted) {
      if (
        protectedPages.includes(path) ||
        path === "/login.html" ||
        path === "/register.html"
      ) {
        window.location.replace("/profile.html");
      }
      return;
    }

    /* ===== PROFILE COMPLETED ===== */
    if (
      path.endsWith("/login.html") ||
      path.endsWith("/register.html") ||
      path === "/index.html" ||
      path === "/"
    ) {
      window.location.replace("/explore.html");
    }

    /* 🚫 NEVER redirect from profile.html */

  } catch (err) {
    console.error("Auth state error:", err);
  }
});

/* =========================================================
   QUESTIONS
========================================================= */

window.createQuestion = async function (title, body, tags = []) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  return addDoc(collection(db, "questions"), {
    title,
    body,
    tags,
    authorName: user.email,
    authorUid: user.uid,
    createdAt: serverTimestamp(),
    answerCount: 0
  });
};

/* =========================================================
   ANSWERS
========================================================= */

window.createAnswer = async function (questionId, body) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  return addDoc(collection(db, "answers"), {
    questionId,
    body,
    authorName: user.email,
    authorUid: user.uid,
    createdAt: serverTimestamp()
  });
};

/* =========================================================
   ROLE FETCH (ADMIN / MODERATOR READY)
========================================================= */

window.getUserRole = async function () {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return "user";

  return snap.data().role || "user";
};
