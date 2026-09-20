const { addChunks } = require("../repository/chunks.repository");

const embed_file = async(client, indexed_file_id, content)=>{
    try{
        
        const lines = content.split('\n');
        const CHUNK_LINES = 40;
        for(let start=0; start<lines.length; start+=CHUNK_LINES){
            const end = Math.min(start+CHUNK_LINES, lines.length);
            const chunkData = lines.slice(start,end).join('\n');
            if(!chunkData.trim()) continue;

            // number[] length 768
            const embedding = await embed(chunkData);

            if ( embedding.length === 0) {
                throw new Error("Empty embedding from Ollama");
            }

            const chunks_row =await addChunks(client, indexed_file_id, chunkData, start+1, end, JSON.stringify(embedding));
            if (!chunks_row) throw new Error("Couldn't add chunk");
        }

        return {message:"Chunks added successfully"};
    }catch(err){
        console.log(err);
        throw err; 

    }
}

const embed = async (data)=>{
    try{
        const ollamaRes = await fetch('http://localhost:11434/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'nomic-embed-text',
                prompt: data,
            }),
        });
        if(!ollamaRes.ok){
            throw new Error(`Ollama embeddings failed (${ollamaRes.status})`);
        }
         
        const {embedding} = await ollamaRes.json();

        return embedding
    }catch(err){
        console.log(err);
        throw new Error(`${err.message}`)
    }
}

module.exports={
    embed_file,
    embed
}