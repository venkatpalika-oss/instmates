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

  // Create mandatory user profile
  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    name: fullName,
    email: email,
    role: "user",
    verified: false,
    profileCompleted: false,
    createdAt: serverTimestamp()
  });

  // Force onboarding
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
   AUTH STATE HANDLER (CORE NAVIGATION BRAIN)
========================================================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    document.body.classList.remove("logged-in");
    return;
  }

  document.body.classList.add("logged-in");

  try {
    const snap = await getDoc(doc(db, "users", user.uid));

    // Safety fallback (should never happen, but protects data)
    if (!snap.exists()) {
      window.location.href = "/profile.html";
      return;
    }

    const data = snap.data();

    // Profile not completed → force profile page
    if (!data.profileCompleted) {
      if (!location.pathname.includes("profile.html")) {
        window.location.href = "/profile.html";
      }
    } 
    // Profile completed → allow app access
    else {
      if (
        location.pathname.includes("login") ||
        location.pathname.includes("register") ||
        location.pathname.includes("profile.html")
      ) {
        window.location.href = "/explore.html";
      }
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

/* =========================================================
   ADMIN CHECK (FUTURE – CLAIM BASED)
========================================================= */
/*
import { getIdTokenResult } from "firebase/auth";

onAuthStateChanged(auth, async user => {
  if (!user) return;
  const token = await getIdTokenResult(user);
  if (token.claims.admin) {
    document.body.classList.add("is-admin");
  }
});
*/
