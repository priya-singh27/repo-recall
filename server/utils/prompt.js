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

        const prompt = `
            Use only the following code context to answer.
            If the context is insufficient, say you don't know.

            CONTEXT:
            ${context}

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