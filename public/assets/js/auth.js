/* =========================================================
   InstMates - Firebase Authentication (FINAL – STABLE)
   File: assets/js/auth.js
   SDK: Firebase v9 (Modular)
   - Firebase app initialized in firebase.js
   - Auto-heals missing user documents
   - Guarantees profile document existence
   - Profile-first onboarding enforced
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
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    createdAt: serverTimestamp()
  });

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
   AUTH STATE HANDLER (AUTO-HEAL ENABLED)
========================================================= */

onAuthStateChanged(auth, async (user) => {

  document.body.classList.add("auth-ready");
  document.body.classList.toggle("auth-in", !!user);
  document.body.classList.toggle("auth-out", !user);

  const path = location.pathname;

  const publicPages = [
    "/",
    "/index.html",
    "/knowledge.html",
    "/about.html"
  ];

  if (publicPages.includes(path)) {
    return;
  }

  if (!user) {
    return;
  }

  try {

    /* =====================================================
       AUTO-HEAL: ENSURE USERS DOCUMENT EXISTS
    ===================================================== */

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {

      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName || user.email.split("@")[0],
        email: user.email,
        role: "user",
        verified: false,
        profileCompleted: false,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: serverTimestamp()
      });

      console.log("Auto-created missing user document.");
    }

    const updatedUserSnap = await getDoc(userRef);
    const userData = updatedUserSnap.data();

    /* =====================================================
       ENSURE PROFILE DOCUMENT EXISTS
    ===================================================== */

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

      console.log("Auto-created missing profile document.");
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

    if (
      path.endsWith("/login.html") ||
      path.endsWith("/register.html")
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
   ROLE FETCH
========================================================= */

window.getUserRole = async function () {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return "user";

  return snap.data().role || "user";
};
