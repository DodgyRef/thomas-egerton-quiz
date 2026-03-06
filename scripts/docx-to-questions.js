/**
 * Converts a Word document (Quiz Questions.docx) into questions.json for the quiz app.
 *
 * Expected Word structure:
 * - Use "Heading 1" (or similar) for each round title, e.g. "Round 1 - Current Affairs"
 * - Use normal paragraphs or a numbered list for questions (e.g. "1. What is the capital of France?")
 *
 * Usage:
 *   1. Put your Word file as "Quiz Questions.docx" in the project root (or pass path as first argument).
 *   2. Run: npm run build-questions
 *   3. This overwrites questions.json in the project root.
 *
 * Requires: npm install
 */

const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const cheerio = require('cheerio');

const DEFAULT_INPUT = path.join(__dirname, '..', 'Quiz Questions.docx');
const DEFAULT_OUTPUT = path.join(__dirname, '..', 'questions.json');

// Match "1. Question text" or "1) Question text" and extract number + text
function parseQuestionLine(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
  if (match) return { number: parseInt(match[1], 10), text: match[2].trim() };
  // No number prefix: treat whole line as question text, use 1-based index later
  return { number: 0, text: trimmed };
}

async function convertDocxToQuestions(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    console.error('Input file not found:', inputPath);
    console.error('Place "Quiz Questions.docx" in the project root, or run: node scripts/docx-to-questions.js <path-to-docx>');
    process.exit(1);
  }

  const result = await mammoth.convertToHtml({ path: inputPath });
  const html = result.value;
  if (result.messages.length) console.warn('Mammoth messages:', result.messages);

  const $ = cheerio.load(html);
  const rounds = [];
  let currentRound = null;

  // Walk block elements: h1, h2 = new round; p = question (or part of round title if first after heading)
  $('body').find('h1, h2, h3, p').each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const text = $(el).text().trim();
    if (!text) return;

    const isHeading = tag === 'h1' || tag === 'h2' || tag === 'h3';

    if (isHeading) {
      if (currentRound && currentRound.questions.length > 0) rounds.push(currentRound);
      currentRound = {
        id: rounds.length + 1,
        title: text,
        questions: []
      };
      return;
    }

    if (!currentRound) {
      currentRound = { id: 1, title: 'Round 1', questions: [] };
    }

    const q = parseQuestionLine(text);
    if (q && q.text) {
      const num = q.number > 0 ? q.number : currentRound.questions.length + 1;
      currentRound.questions.push({ number: num, text: q.text });
    }
  });

  if (currentRound && currentRound.questions.length > 0) rounds.push(currentRound);

  // Normalise question numbers to 1, 2, 3... per round
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

convertDocxToQuestions(inputPath, outputPath).catch((err) => {
  console.error(err);
  process.exit(1);
});
