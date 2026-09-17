const get_prompt = (chunks_data, user_input) => {
    try{
        const chunks = chunks_data.filter(item=>item.distance<0.5);
        if(chunks.length>10){
            chunks.length=  10;
        }

        const context = chunks.map((chunk)=>{
            return `
               File: ${chunk.path} (lines ${chunk.start_line}-${chunk.end_line})\n${chunk.content}
            `
        }).join("\n\n--\n\n");

        const prompt = 
        `
            You are a code assistant. Use ONLY the CONTEXT below.
            If CONTEXT is empty or insufficient, say you don't know.

            For every claim that comes from CONTEXT, cite the file and line range
            exactly as shown (path + start_line-end_line). Do not invent line numbers.

            Return ONLY valid JSON (no markdown fences) with this shape:
            {
            "answer": "your explanation here",
            "citations": [
                { "path": "src/foo.js", "start_line": 1, "end_line": 40 }
            ]
            }

            CONTEXT:
            ${context || "(no relevant code found)"}

            QUESTION:
            ${user_input}
            `;
        console.log(prompt)

        return prompt;

    }catch(err){
        console.log(err)
    }
}

module.exports = get_prompt;