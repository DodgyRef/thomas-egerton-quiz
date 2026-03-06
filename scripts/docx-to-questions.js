/**
 * Converts a plain text file (Quiz Questions.txt) into questions.json for the quiz app.
 *
 * Expected text file format:
 * - A line starting with "Round" (e.g. "Round 1" or "Round 1 - Current Affairs") starts a new round.
 * - Every other non-empty line is treated as a question. Optional leading "1. " / "2. " etc. are stripped.
 *
 * Example:
 *   Round 1 - Current Affairs
 *   1. What is the capital of France?
 *   2. Who wrote Romeo and Juliet?
 *   Round 2 - Sport
 *   Which team won the 2020 Premier League?
 *
 * Usage:
 *   1. Put your text file as "Quiz Questions.txt" in the project root (or pass path as first argument).
 *   2. Run: npm run build-questions
 *   3. This overwrites questions.json in the project root.
 *
 * No npm install needed (Node built-ins only).
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_INPUT = path.join(__dirname, '..', 'Quiz Questions.txt');
const DEFAULT_OUTPUT = path.join(__dirname, '..', 'questions.json');

// Line is a round header if it starts with "Round" (case-insensitive), e.g. "Round 1", "Round ONE:", "Round TWO: Trivial Pursuit"
const ROUND_LINE = /^Round\s+/i;

// Match "1. Question text" or "1) Question text" and return just the text
function stripQuestionNumber(line) {
  const trimmed = (line || '').trim();
  const match = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
  return match ? match[2].trim() : trimmed;
}

function convertTxtToQuestions(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    console.error('Input file not found:', inputPath);
    console.error('Place "Quiz Questions.txt" in the project root, or run: node scripts/docx-to-questions.js <path-to-txt>');
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, 'utf8');
  const lines = content.split(/\r?\n/);

  const rounds = [];
  let currentRound = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (ROUND_LINE.test(trimmed)) {
      if (currentRound && currentRound.questions.length > 0) {
        rounds.push(currentRound);
      }
      currentRound = {
        id: rounds.length + 1,
        title: trimmed,
        questions: []
      };
      continue;
    }

    if (!currentRound) {
      currentRound = { id: 1, title: 'Round 1', questions: [] };
    }

    const questionText = stripQuestionNumber(trimmed);
    if (questionText) {
      currentRound.questions.push({ number: currentRound.questions.length + 1, text: questionText });
    }
  }

  if (currentRound && currentRound.questions.length > 0) {
    rounds.push(currentRound);
  }

  // Normalise ids and question numbers
  rounds.forEach((round, i) => {
    round.id = i + 1;
    round.questions = round.questions.map((q, j) => ({ number: j + 1, text: q.text }));
  });

  const out = { rounds };
  fs.writeFileSync(outputPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('Written', rounds.length, 'round(s) to', outputPath);
}

const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_INPUT;
const outputPath = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_OUTPUT;

try {
  convertTxtToQuestions(inputPath, outputPath);
} catch (err) {
  console.error(err);
  process.exit(1);
}
