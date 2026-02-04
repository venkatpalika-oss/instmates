/* =========================================================
   InstMates AI – Minimal Working Connector
   File: assets/js/ai.js
   NOTE:
   - Simple version
   - One analyzer → one knowledge file
   - Safe, readable, extendable
========================================================= */

const form = document.getElementById("aiForm");
const chatWindow = document.querySelector(".chat-window");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const analyzer = document.getElementById("analyzerType").value;
  const detector = document.getElementById("detectorType").value;
  const question = document.getElementById("aiQuestion").value.trim();

  if (!analyzer || !question) {
    alert("Please select analyzer type and enter your question.");
    return;
  }

  addUserMessage(question);

  addAIMessage("Thinking like a senior field engineer…");

  try {
    const knowledgeText = await loadKnowledge(analyzer);

    const answer = await askAI({
      analyzer,
      detector,
      question,
      knowledgeText
    });

    updateLastAIMessage(answer);

  } catch (err) {
    updateLastAIMessage("Something went wrong. Please try again.");
    console.error(err);
  }
});

/* ================= HELPERS ================= */

function addUserMessage(text) {
  chatWindow.innerHTML += `
    <div class="chat-msg user">
      <p>${text}</p>
    </div>
  `;
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addAIMessage(text) {
  chatWindow.innerHTML += `
    <div class="chat-msg ai" id="aiThinking">
      <p class="muted">${text}</p>
    </div>
  `;
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function updateLastAIMessage(text) {
  const msg = document.getElementById("aiThinking");
  if (msg) msg.innerHTML = `<p>${text}</p>`;
}

/* ================= LOAD KNOWLEDGE ================= */

async function loadKnowledge(analyzer) {
  let file = "";

  if (analyzer === "gc") {
    file = "/ai-knowledge/gc-troubleshooting.txt";
  } else if (analyzer === "cems") {
    file = "/ai-knowledge/cems-troubleshooting.txt";
  } else if (analyzer === "oxygen") {
    file = "/ai-knowledge/oxygen-analyzer-troubleshooting.txt";
  }

  const res = await fetch(file);
  return await res.text();
}

/* ================= AI CALL (PLACEHOLDER) ================= */

async function askAI({ analyzer, detector, question, knowledgeText }) {

  const response = await fetch(
    "https://us-central1-instmates.cloudfunctions.net/askAI",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        analyzer,
        detector,
        question,
        knowledge: knowledgeText
      })
    }
  );

  const data = await response.json();

  if (data.error) {
    return "AI could not process your request. Please try again.";
  }

  return data.answer;
}


  /*
    THIS is where OpenAI / GPT will be called later.

    For now, we simulate a response using the knowledge file
    so you can SEE everything working end-to-end.
  */

  return `
Interpretation:
Based on your selection (${analyzer.toUpperCase()}${detector ? " / " + detector.toUpperCase() : ""}), this issue matches known field conditions.

Most Probable Cause:
Refer to the relevant troubleshooting card inside the knowledge base.

Next Step:
Full AI reasoning will be enabled once API connection is added.

(Field-safe placeholder response)
`;
}
