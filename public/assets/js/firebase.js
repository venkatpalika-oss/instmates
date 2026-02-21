/* =========================================================
   InstMates – Firebase Configuration (FINAL STABLE)
========================================================= */

import { initializeApp, getApps } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

import { getAuth } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import { getFirestore } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { getStorage } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

/* ================= YOUR REAL CONFIG ================= */

const firebaseConfig = {
  apiKey: "AIzaSyACIzIFjHxZnKXmwCyIttcgdmzmVEsjo0o",
  authDomain: "instmates.firebaseapp.com",
  projectId: "instmates",
  storageBucket: "instmates.firebasestorage.app",
  messagingSenderId: "417095841554",
  appId: "1:417095841554:web:0ffa2bd04471845537a5cb",
  measurementId: "G-L57QYT7H9F"
};

/* ================= INITIALIZE APP SAFELY ================= */

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

/* ================= SERVICES ================= */

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* ================= EXPORT ================= */

export { auth, db, storage };