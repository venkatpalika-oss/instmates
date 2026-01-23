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
   AUTH STATE HANDLER (NO HOME HIJACK)
========================================================= */

onAuthStateChanged(auth, async (user) => {
  // Mark auth resolved (prevents flicker)
  document.body.classList.add("auth-ready");

  if (!user) {
    document.body.classList.remove("logged-in");
    return;
  }

  document.body.classList.add("logged-in");

  const path = location.pathname;

  // Pages that REQUIRE completed profile
  const protectedPages = [
    "/explore.html",
    "/community.html",
    "/post.html"
  ];

  try {
    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      window.location.href = "/profile.html";
      return;
    }

    const data = snap.data();

    /* ===== PROFILE NOT COMPLETED ===== */
    if (!data.profileCompleted) {

      // Redirect ONLY if user tries protected or auth pages
      if (
        protectedPages.some(p => path.endsWith(p)) ||
        path.endsWith("/login.html") ||
        path.endsWith("/register.html")
      ) {
        window.location.href = "/profile.html";
      }

      // Allow home / marketing pages
      return;
    }

    /* ===== PROFILE COMPLETED ===== */
    if (
      path.endsWith("/login.html") ||
      path.endsWith("/register.html") ||
      path.endsWith("/profile.html")
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
