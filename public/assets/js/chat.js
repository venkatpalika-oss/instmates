import { auth, db } from "./firebase.js";
import { onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const messagesEl = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

let currentUser = null;
let chatId = null;

const params = new URLSearchParams(window.location.search);
const otherUid = params.get("uid");

const user = auth.currentUser;
  if (!user || !otherUid) return;

  currentUser = user;
  chatId = [user.uid, otherUid].sort().join("_");

  await ensureChatExists();
  loadMessages();
});

async function ensureChatExists() {
  const ref = doc(db, "chats", chatId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      users: [currentUser.uid, otherUid],
      lastMessage: "",
      updatedAt: serverTimestamp()
    });
  }
}

function loadMessages() {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, (snap) => {
    messagesEl.innerHTML = "";

    snap.forEach(d => {
      const m = d.data();
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <strong>${m.senderId === currentUser.uid ? "You" : "Them"}</strong>
        <p>${escapeHTML(m.text)}</p>
      `;

      messagesEl.appendChild(div);
    });

    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

chatForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!chatInput.value.trim()) return;

  await addDoc(
    collection(db, "chats", chatId, "messages"),
    {
      senderId: currentUser.uid,
      text: chatInput.value.trim(),
      createdAt: serverTimestamp()
    }
  );

  chatInput.value = "";
};

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
