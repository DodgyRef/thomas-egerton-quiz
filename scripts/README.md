# Quiz Questions: Word → JSON

You can generate `questions.json` from your Word document so you don’t have to type the JSON by hand.

## 1. Format your Word document

- **Round titles:** Use Word’s **Heading 1** (or Heading 2) for each round, e.g.  
  `Round 1 - Current Affairs`  
  `Round 2 - Sport`
- **Questions:** Use normal paragraphs, with or without numbers, e.g.  
  `1. What is the capital of France?`  
  `2. Who wrote Romeo and Juliet?`  
  or just the question text (the script will number them).

## 2. Install dependencies (once)

From the project root:

```bash
npm install
```

## 3. Run the converter

1. Save your Word file as **Quiz Questions.docx** in the project root (same folder as `index.html`).
2. Run:

```bash
npm run build-questions
```

This overwrites **questions.json** in the project root.

To use a different file or output path:

```bash
node scripts/docx-to-questions.js "path/to/your/questions.docx"
node scripts/docx-to-questions.js "Quiz Questions.docx" "path/to/questions.json"
```

## 4. Use in the app

Reload the quiz app and use **Load questions from file** (or let it load `questions.json` if you’re serving the app over HTTP). Your rounds and questions will appear as in the Word document.
