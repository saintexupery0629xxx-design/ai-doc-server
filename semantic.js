// semantic.js
const fs = require("fs");
const path = require("path");
const DuckDB = require("duckdb");
const { embedText } = require("./openai");

const DB_DIR = path.join(__dirname, "db");
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

const DB_PATH = path.join(DB_DIR, "semantic.db");

const db = new DuckDB.Database(DB_PATH);
const conn = db.connect();

// 初期化：テーブル作成
conn.run(`
  CREATE TABLE IF NOT EXISTS files (
    file_path TEXT PRIMARY KEY,
    text TEXT,
    embedding JSON,
    updated_at TIMESTAMP
  )
`);

module.exports = {
  // ファイル本文をインデックスに登録
  async indexFile(filePath, text) {
    const emb = await embedText(text);

    const sql = `
      INSERT OR REPLACE INTO files (file_path, text, embedding, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;

    conn.run(sql, [filePath, text, JSON.stringify(emb)]);
  },

  // AI意味検索
  async semanticSearch(query) {
    const qvec = await embedText(query);

    const rows = conn
      .prepare(
        `
      SELECT 
        file_path,
        text,
        embedding,
        cosine_similarity(embedding, ?) AS score
      FROM files
      ORDER BY score DESC
      LIMIT 10
    `
      )
      .all(JSON.stringify(qvec));

    return rows;
  }
};