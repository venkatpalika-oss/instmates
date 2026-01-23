const steps = [
  {
    label: "Step 1: Process Extraction",
    highlight: ["process"],
    flow: false
  },
  {
    label: "Step 2: Sample Probe",
    highlight: ["probe"],
    flow: true
  },
  {
    label: "Step 3: Filtration",
    highlight: ["filter"],
    flow: true
  },
  {
    label: "Step 4: Pressure Regulation",
    highlight: ["reg"],
    flow: true
  },
  {
    label: "Step 5: GC Injection",
    highlight: ["gc"],
    flow: true
  }
];

let currentStep = 0;
let playing = false;
let timer = null;

const stepLabel = document.getElementById("stepLabel");
const flow = document.getElementById("flow1");

function clearHighlights() {
  document.querySelectorAll(".unit").forEach(el => {
    el.classList.remove("highlight");
  });
}

function applyStep(step) {
  clearHighlights();
  step.highlight.forEach(id => {
    document.getElementById(id).classList.add("highlight");
  });

  flow.style.opacity = step.flow ? 1 : 0;
  stepLabel.textContent = step.label;
}

function nextStep() {
  applyStep(steps[currentStep]);
  currentStep = (currentStep + 1) % steps.length;
}

document.getElementById("stepBtn").onclick = nextStep;

document.getElementById("playBtn").onclick = () => {
  if (playing) {
    clearInterval(timer);
    playing = false;
    document.getElementById("playBtn").textContent = "▶ Play";
  } else {
    nextStep();
    timer = setInterval(nextStep, 2000);
    playing = true;
    document.getElementById("playBtn").textContent = "⏸ Pause";
  }
};

// init
applyStep(steps[0]);
