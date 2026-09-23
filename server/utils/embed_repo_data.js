const { GoogleGenAI } = require("@google/genai");
const { addChunks } = require("../repository/chunks.repository");
require("dotenv").config();

const EMBED_DIM = 768;
const EMBED_BATCH = 20;
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "text-embedding-004";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const insertPreparedChunks = async(client, indexed_file_id, prepared)=>{
    try{

        for (const c of prepared) {
            const row = await addChunks(
              client, indexed_file_id, c.content, c.start_line, c.end_line, c.embedding
            );
            if (!row) throw new Error("Couldn't add chunk");
        }

        return { message: "Chunks added successfully" };
    }catch(err){
        console.log(err);
        throw err; 

    }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const embedBatch = async (texts, taskType) => {
  if (!texts.length) return [];

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await ai.models.embedContent({
        model: EMBED_MODEL,
        contents: texts,
        config: {
          outputDimensionality: EMBED_DIM,
          taskType,
        },
      });

      const embeddings = response.embeddings?.map((item) => item.values) ?? [];
      if (embeddings.length !== texts.length || embeddings.some((item) => !item?.length)) {
        throw new Error("Empty embedding from Gemini");
      }
      if (embeddings.some((item) => item.length !== EMBED_DIM)) {
        throw new Error(`Gemini embedding must be ${EMBED_DIM} dimensions`);
      }
      return embeddings;
    } catch (err) {
      lastErr = err;
      const retryable = /429|RESOURCE_EXHAUSTED|rate/i.test(err.message || "");
      if (!retryable || attempt === 2) throw err;
      await sleep(1000 * (attempt + 1));
    }
  }

  throw lastErr;
};

const chunkAndEmbed = async (content) => {
  const lines = content.split('\n');
  const CHUNK_LINES = 40;
  const pending = [];

  for (let start = 0; start < lines.length; start += CHUNK_LINES) {
    const end = Math.min(start + CHUNK_LINES, lines.length);
    const chunkData = lines.slice(start, end).join('\n');
    if (!chunkData.trim()) continue;

    pending.push({
      content: chunkData,
      start_line: start + 1,
      end_line: end,
    });
  }

  const prepared = [];
  for (let i = 0; i < pending.length; i += EMBED_BATCH) {
    const batch = pending.slice(i, i + EMBED_BATCH);
    const embeddings = await embedBatch(
      batch.map((chunk) => chunk.content),
      "RETRIEVAL_DOCUMENT"
    );

    embeddings.forEach((embedding, index) => {
      prepared.push({
        ...batch[index],
        embedding: JSON.stringify(embedding),
      });
    });
  }

  return prepared;
};


const embed = async (data, taskType = "RETRIEVAL_QUERY") => {
    try {
        const [embedding] = await embedBatch([data], taskType);
        return embedding;
    } catch (err) {
        console.log(err);
        throw new Error(`${err.message}`);
    }
}

module.exports={
    insertPreparedChunks,
    chunkAndEmbed,
    embed
}
