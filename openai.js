// openai.js
require("dotenv").config();
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = {
  async embedText(text) {
    const res = await client.embeddings.create({
      model: "text-embedding-3-large",
      input: text
    });

    return res.data[0].embedding;
  }
};