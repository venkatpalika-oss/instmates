/* =========================================================
   InstMates AI – Frontend Logic (FINAL, STABLE)
   File: /assets/js/ai.js
========================================================= */

/* ================= LOAD FIELD KNOWLEDGE ================= */

async function loadKnowledge(analyzer) {
  let file = "";

  if (analyzer === "GC") {
    file = "/ai-knowledge/gc-troubleshooting.txt";
  } else if (analyzer === "CEMS") {
    file = "/ai-knowledge/cems-troubleshooting.txt";
  } else if (analyzer === "Oxygen") {
    file = "/ai-knowledge/oxygen-analyzer-troubleshooting.txt";
  }

  if (!file) return "";

  try {
    const res = await fetch(file);
    if (!res.ok) return "";
    return await res.text();
  } catch (err) {
    console.error("Knowledge load failed:", err);
    return "";
  }
}

/* ================= MAIN LOGIC ================= */

document.addEventListener("DOMContentLoaded", () => {
  const answerBox = document.getElementById("answer");
  const askBtn = document.getElementById("askBtn");

  if (!answerBox || !askBtn) return;

  askBtn.addEventListener("click", async () => {
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

      if (!response.ok) {
        throw new Error("AI service error");
      }

      const data = await response.json();

      const aiText =
        data.answer ||
        data.reply ||
        data.response ||
        data.result ||
        data.text ||
        "";

      if (!aiText || typeof aiText !== "string") {
        answerBox.innerHTML =
          "<strong>No usable response returned from InstMates AI.</strong>";
        return;
      }

      /* ================= FORMAT RESPONSE ================= */

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
  });
});
