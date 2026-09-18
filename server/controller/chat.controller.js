const { getChunks } = require("../repository/chunks.repository");
const { embed } = require("../utils/embed_repo_data");
const { serverErrorResponse, successResponse } = require("../utils/response");
const get_prompt = require('../utils/prompt');
const {GoogleGenAI} = require('@google/genai')
require('dotenv').config()

const ai = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});

const sendChatBot =  async (req,res) =>{
    try{
        const {user_input, repo_id} = req.body;

        const embedding = await embed(user_input);
        const embedding_string = JSON.stringify(embedding)
        const chunks_data = await getChunks(embedding_string, repo_id);

        const prompt  = get_prompt(chunks_data, user_input);

        const stream = await ai.models.generateContentStream({
            model:process.env.GEMINI_CHAT_MODEL,
            contents:prompt,
        })

        for await (const chunk of stream) {
            const piece = chunk.text;
            if (piece) {
            }
        }

        // const parsed = JSON.parse(stream.text);//from json string -> js object

        const full=""
        const iterator = stream[Symbol.asyncIterator]();
        while(true){
            const {value:chunk, done} = await iterator.next();
            if(done) break;
            if (chunk?.text) full += chunk.text;
        }

        return successResponse(res, "", "Successfully completed.")

    }catch(err){
        console.log(err)
        return serverErrorResponse(res, err.message)
    }
}

module.exports = {
    sendChatBot
}