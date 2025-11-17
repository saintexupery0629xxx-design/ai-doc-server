require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const sqlite = require("better-sqlite3");
const fs = require("fs");
const app = express();

app.use(express.json({ limit: "50mb" }));

// --- DB 初期化 ---
const db = new sqlite("db.sqlite");
db.exec(`
CREATE TABLE IF NOT EXISTS embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT UNIQUE,
  content TEXT,
  embedding TEXT
);
`);


// --- OpenAI ---
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// --- AIでembedding生成 ---
async function getEmbedding(text) {
  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return res.data[0].embedding;
}


// --- API①：ファイル登録 ---
app.post("/index-file", async (req, res) => {
  try {
    const { file_path, text } = req.body;

    const emb = await getEmbedding(text);

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO embeddings (file_path, content, embedding)
      VALUES (?, ?, ?)
    `);
    stmt.run(file_path, text, JSON.stringify(emb));

    res.json({ ok: true });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: String(e) });
  }
});


// --- コサイン類似度計算 ---
function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}


// --- API②：semantic search ---
app.post("/semantic-search", async (req, res) => {
  try {
    const { query } = req.body;

    const queryEmb = await getEmbedding(query);

    const rows = db.prepare(`SELECT * FROM embeddings`).all();

    const scored = rows.map(r => {
      const emb = JSON.parse(r.embedding);
      return {
        file_path: r.file_path,
        score: cosineSimilarity(queryEmb, emb)
      };
    }).sort((a,b) => b.score - a.score);

    res.json({ results: scored.slice(0, 20) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});


app.get("/", (req,res) => {
  res.send("AI Semantic Search Ready");
});

app.listen(3000, () => {
  console.log("Server running on 3000");
});
