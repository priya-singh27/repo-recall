const { addChunks } = require("../repository/chunks.repository");

const insertPreparedChunks = async(client, indexed_file_id)=>{
    try{

        for (const c of prepared) {
            const row = await addChunks(
              client, indexed_file_id, c.content, c.start_line, c.end_line, c.embedding
            );
            if (!row) throw new Error("Couldn't add chunk");
        }

        return {message:""};
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

module.exports={
    insertPreparedChunks,
    chunkAndEmbed
}