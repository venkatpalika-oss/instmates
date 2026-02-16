/* =========================================================
   InstMates - Firebase Authentication (FINAL – STABLE)
   File: assets/js/auth.js
   SDK: Firebase v9 (Modular)
   NOTE:
   - Firebase app is initialized ONLY ONCE in firebase.js
   - Guarantees profile document existence
   - Enforces profile-first onboarding
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

  /* ---------- USERS COLLECTION ---------- */
  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    name: fullName,
    email: email,
    role: "user",
    verified: false,
    profileCompleted: false,
    createdAt: serverTimestamp()
  });

  /* ---------- PROFILES COLLECTION (CRITICAL) ---------- */
  await setDoc(doc(db, "profiles", cred.user.uid), {
    fullName: fullName,
    role: "Technician",
    bio: "",
    skills: [],
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
   AUTH STATE HANDLER (FINAL – STABLE + UI SYNCED)
========================================================= */

onAuthStateChanged(auth, async (user) => {
  /* ---------- AUTH READY ---------- */
  document.body.classList.add("auth-ready");

  /* ✅ FIX #1: SYNC UI STATE (CRITICAL) */
  document.body.classList.toggle("auth-in", !!user);
  document.body.classList.toggle("auth-out", !user);

  const path = location.pathname;

  /* ================= PUBLIC PAGES ================= */
  const publicPages = [
    "/",
    "/index.html",
    "/knowledge.html",
    "/about.html"
  ];

  if (publicPages.includes(path)) {
    return;
  }

  /* ================= LOGGED OUT ================= */
  if (!user) {
    return;
  }

  try {
    /* ---------- ENSURE USER DOC ---------- */
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      window.location.href = "/profile.html";
      return;
    }

    const userData = userSnap.data();

    /* ---------- ENSURE PROFILE DOC ---------- */
    const profileRef = doc(db, "profiles", user.uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      await setDoc(profileRef, {
        fullName: userData.name || user.email.split("@")[0],
        role: "Technician",
        bio: "",
        skills: [],
        createdAt: serverTimestamp()
      });
    }

    /* ================= PROTECTED PAGES ================= */
    const protectedPages = [
      "/explore.html",
      "/community.html",
      "/post.html",
      "/feed/",
      "/feed/index.html",
      "/profiles/",
      "/profiles/index.html"
    ];

    /* ---------- PROFILE NOT COMPLETED ---------- */
    if (!userData.profileCompleted) {
      if (
        protectedPages.includes(path) ||
        path === "/login.html" ||
        path === "/register.html"
      ) {
        window.location.href = "/profile.html";
      }
      return;
    }

    /* ---------- PROFILE COMPLETED ---------- */
    if (
      path.endsWith("/login.html") ||
      path.endsWith("/register.html")
    ) {
      window.location.href = "/explore.html";
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
