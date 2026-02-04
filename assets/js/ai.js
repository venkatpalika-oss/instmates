/* =========================================================
   InstMates AI – Frontend Logic (FINAL + SAFE)
   File: /assets/js/ai.js
========================================================= */

/* ================= LOAD FIELD KNOWLEDGE ================= */

async function loadKnowledge(analyzer) {
  const map = {
    GC: "/ai-knowledge/gc-troubleshooting.txt",
    CEMS: "/ai-knowledge/cems-troubleshooting.txt",
    Oxygen: "/ai-knowledge/oxygen-analyzer-troubleshooting.txt"
  };

  const file = map[analyzer];
  if (!file) return "";

  try {
    const res = await fetch(file);
    return res.ok ? await res.text() : "";
  } catch {
    return "";
  }
}

/* ================= CORE AI CALL ================= */

async function askInstMatesAI() {
  const answerBox = document.getElementById("answer");

  const analyzer = document.getElementById("analyzer")?.value || "";
  const detector = document.getElementById("detector")?.value || "";
  const question = document.getElementById("question")?.value || "";

  if (!analyzer || !question.trim()) {
    answerBox.innerHTML =
      "<strong>Please select analyzer type and describe the problem.</strong>";
    return;
  }

  answerBox.innerHTML =
    "<em>InstMates AI is analyzing using field knowledge…</em>";

  try {
    const knowledge = await loadKnowledge(analyzer);

    const response = await fetch(
      "https://us-central1-instmates.cloudfunctions.net/askAI",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analyzer,
          detector,
          question,
          knowledge
        })
      }
    );

    if (!response.ok) throw new Error("AI request failed");

    const data = await response.json();
    const aiText = data.answer || "";

    if (!aiText) {
      answerBox.innerHTML =
        "<strong>No usable response returned from InstMates AI.</strong>";
      return;
    }

    const formatted = aiText
      .replace(/(^|\n)1\.\s*(.*)/gi, "<h4>🧠 Interpretation</h4><p>$2</p>")
      .replace(/(^|\n)2\.\s*(.*)/gi, "<h4>⚠️ Most Probable Cause</h4><p>$2</p>")
      .replace(/(^|\n)3\.\s*(.*)/gi, "<h4>🛠️ Field Check Sequence</h4><p>$2</p>")
      .replace(/(^|\n)4\.\s*(.*)/gi, "<h4>❌ What This Is NOT</h4><p>$2</p>")
      .replace(/(^|\n)5\.\s*(.*)/gi, "<h4>📌 Field Rule</h4><p><strong>$2</strong></p>")
      .replace(/\n/g, "<br>");

    answerBox.innerHTML = formatted;

  } catch (err) {
    console.error("InstMates AI error:", err);
    answerBox.innerHTML =
      "<strong>Error connecting to InstMates AI service.</strong>";
  }
}

/* ================= EVENT BINDINGS ================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("aiForm");
  const askBtn = document.querySelector("button[type='submit']");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      askInstMatesAI();
    });
  }

  if (askBtn) {
    askBtn.addEventListener("click", (e) => {
      e.preventDefault();
      askInstMatesAI();
    });
  }
});
