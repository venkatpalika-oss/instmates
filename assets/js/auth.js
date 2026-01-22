/* =========================================================
   InstMates - Firebase Authentication (FINAL)
   File: assets/js/auth.js
   SDK: Firebase v9 (Modular)
   NOTE:
   - Firebase app is initialized ONLY ONCE in firebase.js
   - This file contains auth + firestore logic only
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

/* ================= REGISTER (BASIC) ================= */

window.registerUser = async function (email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
};

/* ================= LOGIN ================= */

window.loginUser = async function (email, password) {
  return signInWithEmailAndPassword(auth, email, password);
};

/* ================= LOGOUT ================= */

window.logoutUser = async function () {
  return signOut(auth);
};

/* ================= AUTH STATE ================= */

onAuthStateChanged(auth, user => {
  if (user) {
    document.body.classList.add("logged-in");
    console.log("Logged in:", user.email);
  } else {
    document.body.classList.remove("logged-in");
    console.log("Logged out");
  }
});

/* ================= REGISTER WITH PROFILE (OPTIONAL) ================= */
/* Does NOT replace registerUser above */

window.registerUserWithProfile = async function (email, password, fullName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", cred.user.uid), {
    name: fullName,
    email: email,
    role: "user",
    verified: false,
    createdAt: serverTimestamp()
  });

  return cred;
};

/* ================= QUESTIONS ================= */

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

/* ================= ANSWERS ================= */

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

/* ================= ROLE FETCH (ADMIN / MODERATOR) ================= */

window.getUserRole = async function () {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return null;

  return snap.data().role || "user";
};

/* ================= ADMIN CHECK (FUTURE READY) ================= */
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
