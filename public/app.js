let currentQuestion = null;
let timerId = null;
let timeLeft = 60;
let score = 0;

const startBtn = document.getElementById("startBtn");
const submitBtn = document.getElementById("submitBtn");
const nextBtn = document.getElementById("nextBtn");
const saveScoreBtn = document.getElementById("saveScoreBtn");

const buggyCode = document.getElementById("buggyCode");
const editor = document.getElementById("editor");
const result = document.getElementById("result");
const timer = document.getElementById("timer");
const language = document.getElementById("language");
const scoreDisplay = document.getElementById("score");
const leaderboardList = document.getElementById("leaderboard");
const playerName = document.getElementById("playerName");
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "Dark" : "Light";
  themeToggle.setAttribute("aria-pressed", theme === "dark");
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "light" ? "dark" : "light";
  applyTheme(next);
  localStorage.setItem("bugbattle-theme", next);
}

async function fetchQuestion() {
  const response = await fetch("/api/questions");
  if (!response.ok) {
    throw new Error("Failed to fetch question");
  }
  return response.json();
}

function setButtons(state) {
  submitBtn.disabled = !state.canSubmit;
  nextBtn.disabled = !state.canNext;
}

function startTimer(seconds) {
  timeLeft = seconds;
  timer.textContent = `${timeLeft}s`;

  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft -= 1;
    timer.textContent = `${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timerId);
      result.textContent = "Time's up. Try the next one.";
      setButtons({ canSubmit: false, canNext: true });
    }
  }, 1000);
}

function resetEditor() {
  editor.value = currentQuestion ? currentQuestion.buggyCode : "";
  editor.disabled = false;
}

async function loadQuestion() {
  try {
    currentQuestion = await fetchQuestion();
    buggyCode.textContent = currentQuestion.buggyCode;
    language.textContent = `Language: ${currentQuestion.language}`;
    result.textContent = "";
    resetEditor();
    startTimer(currentQuestion.timeLimit || 60);
    setButtons({ canSubmit: true, canNext: false });
  } catch (error) {
    result.textContent = "Could not load a question.";
  }
}

async function submitAnswer() {
  if (!currentQuestion) return;

  const response = await fetch("/api/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: currentQuestion.id,
      userCode: editor.value
    })
  });

  const data = await response.json();
  if (!data.ok) {
    result.textContent = data.message || "Validation failed.";
    return;
  }

  clearInterval(timerId);
  editor.disabled = true;

  if (data.correct) {
    score += 1;
    result.textContent = "Correct! Great job.";
  } else {
    result.textContent = "Incorrect. Check the bug and try again next time.";
  }

  scoreDisplay.textContent = `Score: ${score}`;
  setButtons({ canSubmit: false, canNext: true });
}

async function loadLeaderboard() {
  const response = await fetch("/api/leaderboard");
  if (!response.ok) return;
  const entries = await response.json();

  leaderboardList.innerHTML = "";
  if (!entries.length) {
    const item = document.createElement("li");
    item.textContent = "No scores yet.";
    leaderboardList.appendChild(item);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = `${entry.name} - ${entry.score}`;
    leaderboardList.appendChild(item);
  });
}

async function saveScore() {
  const name = playerName.value.trim() || "Anonymous";

  const response = await fetch("/api/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, score })
  });

  if (response.ok) {
    await loadLeaderboard();
  }
}

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  await loadQuestion();
  await loadLeaderboard();
});

submitBtn.addEventListener("click", submitAnswer);

nextBtn.addEventListener("click", async () => {
  await loadQuestion();
});

saveScoreBtn.addEventListener("click", saveScore);

window.addEventListener("load", loadLeaderboard);
window.addEventListener("load", () => {
  const savedTheme = localStorage.getItem("bugbattle-theme") || "light";
  applyTheme(savedTheme);
});

themeToggle.addEventListener("click", toggleTheme);
