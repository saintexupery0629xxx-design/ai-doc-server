const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 1️⃣ ファイル内容を AI に保存
app.post("/index-file", async (req, res) => {
  try {
    const { file_path, text } = req.body;

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: "You store documents in memory for semantic search." },
        { role: "user", content: `Store this document.\nPath: ${file_path}\nContent:\n${text}` }
      ]
    });

    res.json({ ok: true, response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// 2️⃣ Semantic Search
app.post("/semantic-search", async (req, res) => {
  try {
    const { query } = req.body;

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: "You perform semantic search over previously indexed documents." },
        { role: "user", content: `Search documents for: ${query}` }
      ]
    });

    res.json({ ok: true, results: response.output_text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// 3️⃣ Render用ポート
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});


