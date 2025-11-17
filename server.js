import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 1️⃣ ファイルを OpenAI の Vector Store に登録
app.post("/index-file", async (req, res) => {
  try {
    const { file_path, text } = req.body;

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: "You are a semantic search embedding generator."
        },
        {
          role: "user",
          content: `Save this file into vector memory:\nPath: ${file_path}\nContent:\n${text}`
        }
      ]
    });

    res.json({ success: true, result: response });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Index failed" });
  }
});

// 2️⃣ 意味検索 API
app.post("/semantic-search", async (req, res) => {
  try {
    const { query } = req.body;

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: "You are an AI that performs semantic search over previously indexed documents."
        },
        {
          role: "user",
          content: `Find relevant documents for the query: ${query}`
        }
      ]
    });

    res.json({ success: true, results: response.output_text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Search failed" });
  }
});

// 3️⃣ Render のポート対応
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
