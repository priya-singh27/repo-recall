const { getChunks } = require("../repository/chunks.repository");
const { embed } = require("../utils/embed_repo_data");
const { serverErrorResponse, successResponse } = require("../utils/response");

const sendChatBot =  async (req,res) =>{
    try{
        const {user_input, repo_id} = req.body;

        const embedding = await embed(user_input);
        const embedding_string = JSON.stringify(embedding)
        const chunks_data = await getChunks(embedding_string, repo_id);

        console.log(chunks_data);
        return successResponse(res, chunks_data, "Successfully completed.")

    }catch(err){
        console.log(err)
        return serverErrorResponse(res, err.message)
    }
}

module.exports = {
    sendChatBot
}