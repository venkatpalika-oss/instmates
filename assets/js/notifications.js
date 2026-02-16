/* =========================================================
   InstMates – Notification Utilities
   File: assets/js/notifications.js
========================================================= */

import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export async function createNotification({
  toUid,
  fromUid,
  type,
  postId,
  message
}) {
  if (!toUid || !fromUid || toUid === fromUid) return;

  await addDoc(collection(db, "notifications"), {
    toUid,
    fromUid,
    type,
    postId,
    message,
    read: false,
    createdAt: serverTimestamp()
  });
}
