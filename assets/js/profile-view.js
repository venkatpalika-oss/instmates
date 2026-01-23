import { db } from "./firebase.js";
import { doc, getDoc } from
"https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= GET UID ================= */

const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");

if (!uid) {
  document.body.innerHTML = "<p>User not found</p>";
  throw new Error("Missing UID");
}

/* ================= LOAD PROFILE ================= */

(async function () {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      document.body.innerHTML = "<p>User not found</p>";
      return;
    }

    const d = snap.data();

    // Header
    setText("pv-name", d.name || "Anonymous");
    setText("pv-role", d.role || "");
    setText("pv-location", d.location ? "📍 " + d.location : "");

    setText("pv-exp",
      d.experienceYears ? `${d.experienceYears}+ Years Experience` : ""
    );

    setText("pv-domain",
      d.primaryDomain ? `Domain: ${d.primaryDomain}` : ""
    );

    setText("pv-industries",
      d.industries?.length ? `Industries: ${d.industries.join(", ")}` : ""
    );

    setText("pv-summary",
      d.summary || "No summary provided."
    );

    /* ================= TROUBLESHOOTING ================= */

    const wrap = document.getElementById("pv-troubleshooting");
    wrap.innerHTML = "";

    if (!d.majorTroubleshooting || !d.majorTroubleshooting.length) {
      wrap.innerHTML = "<p class='muted'>No major troubleshooting added yet.</p>";
      return;
    }

    d.majorTroubleshooting.forEach(t => {
      const div = document.createElement("div");
      div.className = "trouble-public";

      div.innerHTML = `
        <h4>🔧 ${t.system || "System / Analyzer"}</h4>
        <p><strong>Problem:</strong> ${t.problem || ""}</p>
        <p><strong>Diagnosis & Action:</strong> ${t.action || ""}</p>
        <p><strong>Outcome:</strong> ${t.outcome || ""}</p>
        <p class="muted"><strong>Why it mattered:</strong> ${t.impact || ""}</p>
      `;

      wrap.appendChild(div);
    });

  } catch (err) {
    console.error("Profile view error:", err);
  }
})();

/* ================= HELPERS ================= */

function setText(id, val){
  const el = document.getElementById(id);
  if (el) el.innerText = val;
}
