const get_prompt = (content, user_input) => {
    try{
        if(!content) return null;

        const chunks = content.filter(item=>Number(item.distance)<0.5);
        if(chunks.length>10){
            chunks.length=  10;
        }
        const sources=[]
        const context = chunks.map((chunk, idx)=>{
            const obj = {
                id: idx+1,
                path:chunk.path,
                start_line:chunk.start_line,
                end_line:chunk.end_line
            }
            sources.push(obj);

            return `
               [${idx+1}] ${chunk.path} (lines ${chunk.start_line}-${chunk.end_line})\n${chunk.content}
            `
        }).join("\n\n--\n\n");

        console.log("Context: ");
        console.log(context)

        const prompt = 
        `
            You are a code assistant. Use ONLY the CONTEXT below.
            If CONTEXT is empty or insufficient, ask them to specifically mention what they want.

            CONTEXT:
            ${context || "(no relevant code found)"}

            QUESTION:
            ${user_input}

            Cite the blocks you use with their bracketed ID, e.g. [2].
            Use only IDs that appear in CONTEXT. Never invent IDs, file paths, or line numbers.
            `;
        console.log(prompt)

        return {
            prompt,
            sources
        };

    }catch(err){
        console.log(err)
    }
}

module.exports = get_prompt;