import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc
} from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const inbox = document.getElementById("inboxList");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  const q = query(
    collection(db, "messages"),
    where("toUid", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    inbox.innerHTML = "<p class='muted'>No messages yet.</p>";
    return;
  }

  inbox.innerHTML = "";

  snap.forEach(async (d) => {
    const m = d.data();

    const row = document.createElement("div");
    row.className = "card";
    row.style.marginBottom = "12px";

    row.innerHTML = `
      <p><strong>From:</strong> ${m.fromUid}</p>
      <p>${m.message}</p>
      <div class="action-row">
        <a class="btn btn-ghost"
           href="/message.html?to=${m.fromUid}">
           Reply
        </a>
      </div>
    `;

    inbox.appendChild(row);

    if (!m.read) {
      await updateDoc(doc(db, "messages", d.id), { read: true });
    }
  });
});
