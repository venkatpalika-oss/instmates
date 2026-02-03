/* =========================================================
   InstMates – Field Case Studies Ticker (DYNAMIC)
   File: assets/js/case-ticker.js
========================================================= */

import { db } from "./firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const track = document.getElementById("caseTickerTrack");

async function loadCaseTicker() {
  if (!track) return;

  try {
    const q = query(
      collection(db, "caseStudies"),
      where("published", "==", true),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      track.textContent = "No field case studies published yet.";
      return;
    }

    const titles = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.title) titles.push(data.title);
    });

    track.textContent =
      "🔥 Field Case Studies: " +
      titles.join(" • ") +
      " • Click to explore all →";

  } catch (err) {
    console.error("Case ticker load failed:", err);
    track.textContent = "Field case studies unavailable.";
  }
}

loadCaseTicker();
