/* =========================================================
   InstMates - Firebase Authentication (FINAL)
   File: assets/js/auth.js
   SDK: Firebase v9 (Modular)
========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ================= FIREBASE CONFIG ================= */

const firebaseConfig = {
  apiKey: "AIzaSyACIzIFjHxZnKXmwCyIttcgdmzmVEsjo0o",
  authDomain: "instmates.firebaseapp.com",
  projectId: "instmates",
  storageBucket: "instmates.firebasestorage.app",
  messagingSenderId: "417095841554",
  appId: "1:417095841554:web:0ffa2bd04471845537a5cb",
  measurementId: "G-L57QYT7H9F"
};

/* ================= INIT ================= */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* ================= REGISTER ================= */

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
