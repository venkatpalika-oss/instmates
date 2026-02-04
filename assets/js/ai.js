async function loadKnowledge(analyzer) {
  let file = "";

  if (analyzer === "GC") {
    file = "/ai-knowledge/gc-troubleshooting.txt";
  }
  if (analyzer === "CEMS") {
    file = "/ai-knowledge/cems-troubleshooting.txt";
  }
  if (analyzer === "Oxygen") {
    file = "/ai-knowledge/oxygen-analyzer-troubleshooting.txt";
  }

  if (!file) return "";

  const res = await fetch(file);
  return await res.text();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("aiForm");
  const answerBox = document.getElementById("answer");

  if (!form || !answerBox) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const analyzer = document.getElementById("analyzer").value;
    const detector = document.getElementById("detector").value;
    const question = document.getElementById("question").value;

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

      const data = await response.json();

      const aiText =
        data.answer ||
        data.reply ||
        data.response ||
        data.result ||
        "";

      if (!aiText) {
        answerBox.innerHTML =
          "<strong>No usable response returned from InstMates AI.</strong>";
        return;
      }

      const formatted = aiText
        .replace(/1\.\s*(.*)/gi, "<h4>🧠 Interpretation</h4><p>$1</p>")
        .replace(/2\.\s*(.*)/gi, "<h4>⚠️ Most Probable Cause</h4><p>$1</p>")
        .replace(/3\.\s*(.*)/gi, "<h4>🛠️ Field Check Sequence</h4><p>$1</p>")
        .replace(/4\.\s*(.*)/gi, "<h4>❌ What This Is NOT</h4><p>$1</p>")
        .replace(/5\.\s*(.*)/gi, "<h4>📌 Field Rule</h4><p><strong>$1</strong></p>")
        .replace(/\n/g, "<br>");

      answerBox.innerHTML = formatted;

    } catch (err) {
      console.error(err);
      answerBox.innerHTML =
        "<strong>Error connecting to InstMates AI service.</strong>";
    }
  });
});
