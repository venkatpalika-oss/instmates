/* =========================================================
   InstMates – Send Message Logic (FINAL, GUARDED)
   File: assets/js/message.js
========================================================= */

import { auth, db } from "./firebase.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= QUERY PARAM ================= */

const params = new URLSearchParams(window.location.search);
const toUid = params.get("to");

/* ================= DOM ELEMENTS (GUARD) ================= */

const form = document.getElementById("messageForm");
const textarea = document.getElementById("messageText");
const status = document.getElementById("messageStatus");

if (!form || !textarea) {
  console.error("❌ Message form elements missing in DOM");
  return;
}

/* ================= AUTH CHECK ================= */

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("/login.html");
  }
});

/* ================= SUBMIT HANDLER ================= */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  const text = textarea.value.trim();

  if (!user || !toUid || !text) {
    if (status) status.textContent = "Unable to send message.";
    return;
  }

  try {
    if (status) status.textContent = "Sending…";

    await addDoc(collection(db, "messages"), {
      fromUid: user.uid,
      toUid: toUid,
      message: text,
      createdAt: serverTimestamp(),
      read: false
    });

    if (status) status.textContent = "✅ Message sent successfully";
    textarea.value = "";

    setTimeout(() => {
      window.history.back();
    }, 800);

  } catch (err) {
    console.error("Message send failed:", err);
    if (status) status.textContent = "❌ Failed to send message";
  }
});
