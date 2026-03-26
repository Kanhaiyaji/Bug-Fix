const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const QUESTIONS = [
  {
    id: 1,
    language: "C",
    buggyCode: "#include <stdio.h>\n\nint main() {\n    int x = 5;\n    if (x = 10) {\n        printf(\"x is ten\\n\");\n    }\n    return 0;\n}\n",
    hint: "Check the comparison inside the if statement.",
    correctCode:
      "#include <stdio.h>\n\nint main() {\n    int x = 5;\n    if (x == 10) {\n        printf(\"x is ten\\n\");\n    }\n    return 0;\n}\n"
  },
  {
    id: 2,
    language: "Java",
    buggyCode:
      "public class Main {\n    public static void main(String[] args) {\n        int sum = 0;\n        for (int i = 1; i <= 5; i++)\n            sum += i\n        System.out.println(sum);\n    }\n}\n",
    hint: "Look for missing punctuation or braces in the loop.",
    correctCode:
      "public class Main {\n    public static void main(String[] args) {\n        int sum = 0;\n        for (int i = 1; i <= 5; i++) {\n            sum += i;\n        }\n        System.out.println(sum);\n    }\n}\n"
  },
  {
    id: 3,
    language: "Python",
    buggyCode: "def greet(name):\n    print(\"Hello \" + name)\n\nprint(greet(\"Ada\"))\n",
    hint: "Think about what the function should return versus print.",
    correctCode:
      "def greet(name):\n    return \"Hello \" + name\n\nprint(greet(\"Ada\"))\n"
  },
  {
    id: 4,
    language: "Java",
    buggyCode:
      "public class Main {\n    public static void main(String[] args) {\n        String word = null;\n        if (word.equals(\"bug\")) {\n            System.out.println(\"Found\");\n        }\n    }\n}\n",
    hint: "Avoid calling methods on a possible null reference.",
    correctCode:
      "public class Main {\n    public static void main(String[] args) {\n        String word = null;\n        if (\"bug\".equals(word)) {\n            System.out.println(\"Found\");\n        }\n    }\n}\n"
  },
  {
    id: 5,
    language: "Python",
    buggyCode:
      "numbers = [1, 2, 3, 4]\nprint(numbers[4])\n",
    hint: "Remember how list indexes start in Python.",
    correctCode:
      "numbers = [1, 2, 3, 4]\nprint(numbers[3])\n"
  },
  {
    id: 6,
    language: "C",
    buggyCode:
      "#include <stdio.h>\n\nint main() {\n    int i;\n    for (i = 0; i <= 5; i++) {\n        printf(\"%d \", i);\n    }\n    return 0;\n}\n",
    hint: "Check the loop condition and how many times it runs.",
    correctCode:
      "#include <stdio.h>\n\nint main() {\n    int i;\n    for (i = 0; i < 5; i++) {\n        printf(\"%d \", i);\n    }\n    return 0;\n}\n"
  }
];

const leaderboard = [];

function normalizeCode(code) {
  return String(code || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}

app.get("/api/questions", (req, res) => {
  const random = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  res.json({
    id: random.id,
    language: random.language,
    buggyCode: random.buggyCode,
    hint: random.hint,
    timeLimit: 60
  });
});

app.get("/api/questions/all", (req, res) => {
  const payload = QUESTIONS.map((question) => ({
    id: question.id,
    language: question.language,
    buggyCode: question.buggyCode,
    hint: question.hint,
    timeLimit: 60
  }));
  res.json(payload);
});

app.post("/api/validate", (req, res) => {
  const { id, userCode } = req.body || {};
  const question = QUESTIONS.find((q) => q.id === Number(id));

  if (!question) {
    return res.status(404).json({ ok: false, message: "Question not found" });
  }

  const isCorrect =
    normalizeCode(userCode) === normalizeCode(question.correctCode);

  return res.json({ ok: true, correct: isCorrect });
});

app.get("/api/leaderboard", (req, res) => {
  const sorted = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 10);
  res.json(sorted);
});

app.post("/api/leaderboard", (req, res) => {
  const { name, score } = req.body || {};

  if (!name || typeof score !== "number") {
    return res.status(400).json({ ok: false, message: "Invalid payload" });
  }

  leaderboard.push({
    name: String(name).slice(0, 24),
    score
  });

  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Bug Battle running at http://localhost:${PORT}`);
});
