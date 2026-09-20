const { getFromChunks } = require("../repository/chunks.repository");
const { embed } = require("../utils/embed_repo_data");
const { serverErrorResponse, successResponse, badRequestResponse } = require("../utils/response");
const get_prompt = require('../utils/prompt');
const {GoogleGenAI} = require('@google/genai')
require('dotenv').config()

const ai = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});

const sendChatBot =  async (req,res) =>{
    try{
        const {user_input, repo_id} = req.body;

        const embedding = await embed(user_input);
        const embedding_string = JSON.stringify(embedding)
        const content = await getFromChunks(embedding_string, repo_id);

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.flushHeaders();

        const prompt_res  = get_prompt(content, user_input);
        if(!prompt_res) return serverErrorResponse(res, "There was some error in prompt")
        const {prompt, sources} = prompt_res;

        res.write(`event: sources\ndata: ${JSON.stringify(sources)}\n\n`);

        const stream = await ai.models.generateContentStream({
            model:process.env.GEMINI_CHAT_MODEL,
            contents:prompt,
        });//it will be js object 

        for await (const chunk of stream){
            const data = chunk.text;
            if(data) res.write(`event: text\ndata: ${JSON.stringify(chunk.text)}\n\n`);
        }

        res.write("event: done\ndata: {}\n\n");

        res.end();

    }catch(err){
        console.log(err);
        if (res.headersSent) return res.end();
        return serverErrorResponse(res, err.message)
    }
}

module.exports = {
    sendChatBot
}
/**
STREAMING  RESPONSE

    const response = await ai.models.generateContentStream({
            model:process.env.GEMINI_CHAT_MODEL,
            contents:prompt,
        });//it will be json string 

    const full=""
    const iterator = stream[Symbol.asyncIterator]();
    while(true){
        const {value:chunk, done} = await iterator.next();
        if(done) break;
        if (chunk?.text) full += chunk.text;
    }

    so in while it comes inside the loop and then wait for the next by calling next adn awaiting, 
    but "for await" is automatically build for checking next when it gets data then it enters the loop. 

    So an async iterator has next function and for await is designed to call this next and wait. 
    Async iterator has next() (returns a Promise of { value, done }).

*/

//for await is built to call that next, await it, bind value to chunk, run the body, repeat until done.
// const full=""
// for await (const chunk of stream) {//chunk=result.value. when result.done=true it breaks the loop
//     const piece = chunk.text;

//     if (piece) {
//         res.write(piece);
//     }
// }



// const parsed = JSON.parse(stream.text);//from json string -> js object
