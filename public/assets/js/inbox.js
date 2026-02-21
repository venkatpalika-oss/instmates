import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  updateDoc
} from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const inbox = document.getElementById("inboxList");

// Cache to avoid repeated reads
const userCache = {};

async function getUserName(uid) {
  if (userCache[uid]) return userCache[uid];

  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const name = snap.data().name || "Unknown User";
      userCache[uid] = name;
      return name;
    }
  } catch (e) {
    console.error("User fetch failed:", e);
  }

  return "Unknown User";
}

const user = auth.currentUser;
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

  for (const d of snap.docs) {
    const m = d.data();
    const senderName = await getUserName(m.fromUid);

    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "12px";

    card.innerHTML = `
      <p><strong>From:</strong> ${senderName}</p>
      <p>${m.message}</p>

      <div class="action-row">
        <a class="btn btn-ghost"
           href="/message.html?to=${m.fromUid}">
           Reply
        </a>
      </div>
    `;

    inbox.appendChild(card);

    // Mark as read
    if (!m.read) {
      await updateDoc(doc(db, "messages", d.id), { read: true });
    }
  }
});
