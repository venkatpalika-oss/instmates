/* =========================================================
   InstMates - Firebase Authentication (FINAL)
   File: assets/js/auth.js
   SDK: Firebase v9 (Modular)
   NOTE:
   - Firebase app is initialized ONLY ONCE in firebase.js
   - This file contains auth + firestore logic only
   - Enforces profile-first onboarding (Option A)
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
   AUTH STATE HANDLER (NO HOME HIJACK – FINAL)
========================================================= */

onAuthStateChanged(auth, async (user) => {
  // Prevent header flicker
  document.body.classList.add("auth-ready");

  const path = location.pathname;

  /* ================= PUBLIC PAGES (NEVER REDIRECT) ================= */
  const publicPages = [
    "/",                 // root domain
    "/index.html",
    "/knowledge.html",
    "/about.html"
  ];

  // Handle auth UI only, no navigation
  if (publicPages.includes(path)) {
    if (user) {
      document.body.classList.add("logged-in");
    } else {
      document.body.classList.remove("logged-in");
    }
    return; // 🔴 CRITICAL STOP
  }

  /* ================= LOGGED OUT ================= */
  if (!user) {
    document.body.classList.remove("logged-in");
    return;
  }

  document.body.classList.add("logged-in");

  try {
    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      window.location.href = "/profile.html";
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
        window.location.href = "/profile.html";
      }
      return;
    }

    /* ===== PROFILE COMPLETED ===== */
    if (
      path === "/login.html" ||
      path === "/register.html" ||
      path === "/profile.html"
    ) {
      window.location.href = "/explore.html";
    }

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
