/* =========================================================
   InstMates - Firebase Authentication
   FINAL – STABLE + SMART HOMEPAGE + PROFILE MODAL
   File: assets/js/auth.js
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
   REGISTER
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
  window.location.href = "/";
};

/* =========================================================
   AUTH STATE HANDLER
========================================================= */

onAuthStateChanged(auth, async (user) => {

  document.body.classList.add("auth-ready");
  document.body.classList.toggle("auth-in", !!user);
  document.body.classList.toggle("auth-out", !user);

  const path = location.pathname;

  /* =====================================================
     SMART HOMEPAGE SECTION TOGGLE
  ===================================================== */

  const authOutSections = document.querySelectorAll(".auth-out-section");
  const authInSections  = document.querySelectorAll(".auth-in-section");

  if (path === "/" || path === "/index.html") {
    if (user) {
      authOutSections.forEach(el => el.style.display = "none");
      authInSections.forEach(el => el.style.display = "block");
    } else {
      authOutSections.forEach(el => el.style.display = "block");
      authInSections.forEach(el => el.style.display = "none");
    }
  }

  /* =====================================================
     PUBLIC PAGES
  ===================================================== */

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
       AUTO-HEAL USER DOCUMENT
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
    }

    /* =====================================================
       PROTECTED PAGES
    ===================================================== */

    const protectedPages = [
      "/explore.html",
      "/community.html",
      "/post.html",
      "/feed/",
      "/feed/index.html",
      "/profiles/",
      "/profiles/index.html"
    ];

    /* =====================================================
       STRICT PROFILE-FIRST (MODAL SYSTEM)
    ===================================================== */

    if (!userData.profileCompleted) {

      if (protectedPages.includes(path)) {

        const modal = document.getElementById("profileRequiredModal");
        const btn = document.getElementById("completeProfileBtn");

        if (modal) {
          modal.style.display = "flex";
          document.body.style.overflow = "hidden";
        }

        if (btn) {
          btn.addEventListener("click", () => {
            window.location.href = "/profile.html";
          });
        }

      }

      return;
    }

    /* =====================================================
       REDIRECT LOGIN/REGISTER IF ALREADY AUTHENTICATED
    ===================================================== */

    if (
      path.endsWith("/login.html") ||
      path.endsWith("/register.html")
    ) {
      window.location.href = "/feed/";
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
