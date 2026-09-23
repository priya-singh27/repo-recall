const {pool} = require('../db/db_config');

const addChunks = async (client, indexed_file_id, content, start_line, end_line,embedding)=>{
    try{
        const db = client || pool;
       
        const {rows} = await db.query(`
            INSERT INTO chunks
            (indexed_file_id,content, start_line, end_line,embedding)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [indexed_file_id, content, start_line, end_line, embedding]);
        
        

        console.log("Rows from addChunks");
        console.log(rows)

        if(rows.length>0) return rows[0];
        
        return null;
    }catch(err){
        console.log(err);
        throw new Error(err.message)
    }
}

const deleteChunks = async(client, indexed_file_id)=>{
    try{
        const db = client || pool;

        const {rows} = await db.query(
            `
            DELETE FROM chunks
            WHERE indexed_file_id=$1
            RETURNING id
            `, [indexed_file_id]
        )
        if(rows.length>0){
            console.log("Wiped old indexes")
            return rows.length;
        }
        return null;
    }catch(err){
        console.log(err);
        throw new Error(err.message)
    }
}

const getFromChunks  = async(user_input_embedding, repo_id) => {
    try{
        const {rows} = await pool.query(`
            SELECT c.content, c.start_line, c.end_line, f.path, c.embedding <=> $1::vector AS distance
            FROM chunks c
            JOIN indexed_files f ON f.id = c.indexed_file_id
            WHERE f.repo_id= $2 AND f.active= true
            ORDER BY c.embedding <=> $1::vector
            LIMIT $3
        `,[user_input_embedding, repo_id, 10]);

        return rows;
    }catch(err){
        console.log(err);
        throw new Error(err.message)
    }
}

module.exports={
    addChunks,
    deleteChunks,
    getFromChunks
}