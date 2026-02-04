async function loadKnowledge(analyzer) {
  let file = "";

  if (analyzer === "gc") {
    file = "/ai-knowledge/gc-troubleshooting.txt";
  }
  if (analyzer === "cems") {
    file = "/ai-knowledge/cems-troubleshooting.txt";
  }
  if (analyzer === "oxygen") {
    file = "/ai-knowledge/oxygen-analyzer-troubleshooting.txt";
  }

  if (!file) return "";

  const res = await fetch(file);
  return await res.text();
}

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("aiForm");
  const answerBox = document.getElementById("answer");

  if (!form || !answerBox) {
    console.warn("InstMates AI: required elements not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const analyzer = document.getElementById("analyzerType")?.value;
    const detector = document.getElementById("detectorType")?.value;
    const question = document.getElementById("aiQuestion")?.value;

    if (!analyzer || !question?.trim()) {
      answerBox.innerHTML =
        "<strong>Please select analyzer type and describe the problem.</strong>";
      return;
    }

    answerBox.innerHTML =
      "<em>InstMates AI is analyzing using field knowledge…</em>";

    try {
      const knowledgeText = await loadKnowledge(analyzer);

      const response = await fetch(
        "https://us-central1-instmates.cloudfunctions.net/askAI",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analyzer,
            detector,
            question,
            knowledge: knowledgeText
          })
        }
      );

      const data = await response.json();

      if (!data.answer) {
        answerBox.innerHTML =
          "<strong>No response received from InstMates AI.</strong>";
        return;
      }

      const formatted = data.answer
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
        "<strong>Error connecting to InstMates AI backend.</strong>";
    }
  });
});
