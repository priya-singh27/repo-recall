const get_prompt = (content, user_input) => {
    try{
        if(!content) return null;

        const chunks = content.filter(item=>Number(item.distance)<0.5);
        if(chunks.length>10){
            chunks.length=  10;
        }
        const sources=[]
        const context = chunks.map((chunk)=>{
            const obj = {
                path:chunk.path,
                start_line:chunk.start_line,
                end_line:chunk.end_line
            }
            sources.push(obj);

            return `
               File: ${chunk.path} (lines ${chunk.start_line}-${chunk.end_line})\n${chunk.content}
            `
        }).join("\n\n--\n\n");

        const prompt = 
        `
            You are a code assistant. Use ONLY the CONTEXT below.
            If CONTEXT is empty or insufficient, say you don't know.

            CONTEXT:
            ${context || "(no relevant code found)"}

            QUESTION:
            ${user_input}
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