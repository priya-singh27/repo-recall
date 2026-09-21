const { addChunks } = require("../repository/chunks.repository");

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

const chunkAndEmbed = async (content) => {
  const lines = content.split('\n');
  const CHUNK_LINES = 40;
  const prepared = [];

  for (let start = 0; start < lines.length; start += CHUNK_LINES) {
    const end = Math.min(start + CHUNK_LINES, lines.length);
    const chunkData = lines.slice(start, end).join('\n');
    if (!chunkData.trim()) continue;

    const embedding = await embed(chunkData);
    if (!embedding?.length) throw new Error("Empty embedding from Ollama");

    prepared.push({
      content: chunkData,
      start_line: start + 1,
      end_line: end,
      embedding: JSON.stringify(embedding),
    });
  }

  return prepared;
};


const embed = async (data) => {
    try {
        const ollamaRes = await fetch('http://localhost:11434/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'nomic-embed-text',
                prompt: data,
            }),
            signal: AbortSignal.timeout(10_000)
        });
        if (!ollamaRes.ok) {
            throw new Error(`Ollama embeddings failed (${ollamaRes.status})`);
        }
        const { embedding } = await ollamaRes.json();
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