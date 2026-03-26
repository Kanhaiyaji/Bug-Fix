let currentQuestion = null;
let timerId = null;
let timeLeft = 60;
let score = 0;
let currentRound = 0;
let questionPool = [];
let currentIndex = 0;
let gameActive = false;
let hintVisible = false;

const ROUND_LIMIT = 5;

const startBtn = document.getElementById("startBtn");
const submitBtn = document.getElementById("submitBtn");
const nextBtn = document.getElementById("nextBtn");
const saveScoreBtn = document.getElementById("saveScoreBtn");
const resetBtn = document.getElementById("resetBtn");

const buggyCode = document.getElementById("buggyCode");
const editor = document.getElementById("editor");
const result = document.getElementById("result");
const timer = document.getElementById("timer");
const language = document.getElementById("language");
const scoreDisplay = document.getElementById("score");
const roundDisplay = document.getElementById("round");
const leaderboardList = document.getElementById("leaderboard");
const playerName = document.getElementById("playerName");
const themeToggle = document.getElementById("themeToggle");
const hintBtn = document.getElementById("hintBtn");
const hintText = document.getElementById("hintText");

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

async function fetchAllQuestions() {
  const response = await fetch("/api/questions/all");
  if (!response.ok) {
    throw new Error("Failed to fetch questions");
  }
  return response.json();
}

function setButtons(state) {
  submitBtn.disabled = !state.canSubmit;
  nextBtn.disabled = !state.canNext;
}

function setHintState(enabled) {
  hintBtn.disabled = !enabled;
  hintText.textContent = "";
  hintVisible = false;
  hintBtn.textContent = "Show Hint";
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
      setHintState(false);
    }
  }, 1000);
}

function resetEditor() {
  editor.value = currentQuestion ? currentQuestion.buggyCode : "";
  editor.disabled = false;
}

function updateRound() {
  roundDisplay.textContent = `Round: ${currentRound}/${ROUND_LIMIT}`;
}

function shuffleArray(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function endGame() {
  gameActive = false;
  clearInterval(timerId);
  setButtons({ canSubmit: false, canNext: false });
  setHintState(false);
  startBtn.disabled = false;
  startBtn.textContent = "Play Again";
  resetBtn.disabled = false;
  result.textContent = `Game over! Final score: ${score}/${ROUND_LIMIT}.`;
}

async function loadQuestion() {
  try {
    if (!gameActive) return;
    if (currentRound >= ROUND_LIMIT || currentIndex >= questionPool.length) {
      endGame();
      return;
    }

    currentQuestion = questionPool[currentIndex];
    currentIndex += 1;
    currentRound += 1;
    buggyCode.textContent = currentQuestion.buggyCode;
    language.textContent = `Language: ${currentQuestion.language}`;
    result.textContent = "";
    updateRound();
    resetEditor();
    startTimer(currentQuestion.timeLimit || 60);
    setButtons({ canSubmit: true, canNext: false });
    setHintState(true);
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
  setHintState(false);

  if (data.correct) {
    score += 1;
    result.textContent = "Correct! Great job.";
  } else {
    result.textContent = "Incorrect. Check the bug and try again next time.";
  }

  scoreDisplay.textContent = `Score: ${score}`;
  if (currentRound >= ROUND_LIMIT) {
    endGame();
  } else {
    setButtons({ canSubmit: false, canNext: true });
  }
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

async function startGame() {
  try {
    const allQuestions = await fetchAllQuestions();
    questionPool = shuffleArray(allQuestions).slice(0, ROUND_LIMIT);
    currentIndex = 0;
    currentRound = 0;
    score = 0;
    scoreDisplay.textContent = "Score: 0";
    updateRound();
    result.textContent = "";
    gameActive = true;
    startBtn.disabled = true;
    resetBtn.disabled = false;
    await loadQuestion();
    await loadLeaderboard();
  } catch (error) {
    result.textContent = "Could not start the game.";
  }
}

function resetGame() {
  clearInterval(timerId);
  gameActive = false;
  currentQuestion = null;
  currentRound = 0;
  currentIndex = 0;
  score = 0;
  scoreDisplay.textContent = "Score: 0";
  updateRound();
  buggyCode.textContent = "Press Start Game to begin.";
  editor.value = "";
  editor.disabled = true;
  result.textContent = "";
  setButtons({ canSubmit: false, canNext: false });
  setHintState(false);
  resetBtn.disabled = true;
  startBtn.disabled = false;
  startBtn.textContent = "Start Game";
}

startBtn.addEventListener("click", startGame);

submitBtn.addEventListener("click", submitAnswer);

nextBtn.addEventListener("click", async () => {
  if (!gameActive) return;
  await loadQuestion();
});

saveScoreBtn.addEventListener("click", saveScore);
resetBtn.addEventListener("click", resetGame);
hintBtn.addEventListener("click", () => {
  if (!currentQuestion || !currentQuestion.hint) return;
  hintVisible = !hintVisible;
  hintText.textContent = hintVisible ? currentQuestion.hint : "";
  hintBtn.textContent = hintVisible ? "Hide Hint" : "Show Hint";
});

window.addEventListener("load", loadLeaderboard);
window.addEventListener("load", () => {
  const savedTheme = localStorage.getItem("bugbattle-theme") || "light";
  applyTheme(savedTheme);
  resetGame();
});

themeToggle.addEventListener("click", toggleTheme);
