/* =========================================================
   InstMates – Like / Unlike Logic (FINAL)
   File: assets/js/likes.js
========================================================= */

import { auth, db } from "./firebase.js";
import {
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= LIKE HANDLER ================= */

window.toggleLike = async function ({
  type,      // "post" | "comment"
  postId,
  commentId,
  button
}) {
  const user = auth.currentUser;
  if (!user) return;

  // Disable button to avoid spam
  button.disabled = true;

  let ref;

  if (type === "post") {
    ref = doc(db, "posts", postId);
  }

  if (type === "comment") {
    ref = doc(db, "posts", postId, "comments", commentId);
  }

  const liked = button.dataset.liked === "true";

  try {
    await updateDoc(ref, {
      likes: increment(liked ? -1 : 1),
      [`likedBy.${user.uid}`]: liked ? false : true
    });

    // Update UI
    button.dataset.liked = liked ? "false" : "true";

    const countEl = button.querySelector(".like-count");
    countEl.textContent =
      parseInt(countEl.textContent) + (liked ? -1 : 1);

    button.classList.toggle("liked", !liked);

  } catch (err) {
    console.error("Like failed:", err);
  }

  button.disabled = false;
};
