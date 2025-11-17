// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { indexFile, semanticSearch } = require("./semantic");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// 動作確認用
app.get("/", (req, res) => {
  res.send("AI Semantic Search API OK");
});

// ファイルをインデックス登録
app.post("/index-file", async (req, res) => {
  const { file_path, text } = req.body;
  if (!file_path || !text) return res.status(400).json({ error: "invalid request" });

  await indexFile(file_path, text);
  res.json({ status: "indexed" });
});

// AI意味検索
app.post("/semantic-search", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "query required" });

  const results = await semanticSearch(query);
  res.json({ results });
});

// 起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});