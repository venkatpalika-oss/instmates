import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const toUid = params.get("to");

const form = document.getElementById("messageForm");
const textarea = document.getElementById("messageText");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/login.html";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user || !toUid) return;

  await addDoc(collection(db, "messages"), {
    fromUid: user.uid,
    toUid: toUid,
    message: textarea.value.trim(),
    createdAt: serverTimestamp(),
    read: false
  });

  alert("Message sent successfully");
  window.history.back();
});
