# Quiz Questions: Text file → JSON

You can generate `questions.json` from a plain text file so you don’t have to type the JSON by hand.

## 1. Format your text file

- **Round titles:** Start a line with **Round** and a number, e.g.  
  `Round 1 - Current Affairs`  
  `Round 2 - Sport`
- **Questions:** Put one question per line. You can add numbers or not; they’re stripped if present, e.g.  
  `1. What is the capital of France?`  
  `2. Who wrote Romeo and Juliet?`  
  or just the question text.

Example file (**Quiz Questions.txt**):

```
Round 1 - Current Affairs
1. What is the capital of France?
2. Who wrote Romeo and Juliet?
Round 2 - Sport
Which team won the 2020 Premier League?
```

## 2. Run the converter

No `npm install` needed (Node.js only).

1. Save your file as **Quiz Questions.txt** in the project root (same folder as `index.html`).
2. Run:

```bash
npm run build-questions
```

This overwrites **questions.json** in the project root.

To use a different file or output path:

```bash
node scripts/docx-to-questions.js "path/to/your/Quiz Questions.txt"
node scripts/docx-to-questions.js "Quiz Questions.txt" "path/to/questions.json"
```

## 3. Use in the app

Reload the quiz app and use **Load questions from file** (or let it load `questions.json` if you’re serving the app over HTTP). Your rounds and questions will appear as in the text file.
