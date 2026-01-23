import { db } from "./firebase.js";
import { doc, getDoc } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= GET UID ================= */

const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");

if (!uid) {
  document.body.innerHTML = "<p>User not found.</p>";
  throw new Error("Missing UID");
}

/* ================= LOAD PROFILE ================= */

(async function () {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    document.body.innerHTML = "<p>User not found.</p>";
    return;
  }

  const data = snap.data();

  document.getElementById("pv-name").innerText = data.name || "Anonymous";
  document.getElementById("pv-role").innerText = data.role || "";
  document.getElementById("pv-location").innerText = data.location || "";

  document.getElementById("pv-exp").innerText =
    data.experienceYears ?? "—";

  document.getElementById("pv-domain").innerText =
    data.primaryDomain || "—";

  document.getElementById("pv-industry").innerText =
    data.industries?.join(", ") || "—";

  document.getElementById("pv-summary").innerText =
    data.summary || "No summary provided.";

  const skillsWrap = document.getElementById("pv-skills");
  skillsWrap.innerHTML = "";

  (data.skills || []).forEach(skill => {
    const s = document.createElement("span");
    s.className = "skill";
    s.innerText = skill;
    skillsWrap.appendChild(s);
  });
})();
