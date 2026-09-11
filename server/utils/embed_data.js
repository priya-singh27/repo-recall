const { addChunks } = require("../repository/chunks.repository");

const embed_file = async(indexed_file_id, content,path)=>{
    try{

        const lines = content.split('\n');
        const CHUNK_LINES = 40;
        for(let start=0; start<lines.length; start+=CHUNK_LINES){
            const end = Math.min(start+CHUNK_LINES, lines.length);
            const chunkData = lines.slice(start,end).join('\n');

            const ollamaRes = await fetch('http://localhost:11434/api/embeddings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'nomic-embed-text',
                    prompt: chunkData,
                }),
            });
            const {embedding} = await ollamaRes.json();// number[] length 768

            const chunks_row =await addChunks(indexed_file_id,path, chunkData, start+1, end, JSON.stringify(embedding));
        }

        return {message:"Chunks added successfully"};
    }catch(err){
        console.log(err)
    }
}

module.exports={
    embed_file
}