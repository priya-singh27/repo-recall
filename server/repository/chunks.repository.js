const {pool} = require('../db/db_config')

const addChunks = async (indexed_file_id, content, start_line, end_line,embedding, indexed_file_id)=>{
    try{
        
        const {rows} = await pool.query(`
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
        console.log(err)
    }
}

const deleteChunks = async(indexed_file_id)=>{
    try{
        const {rows} = await pool.query(
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
        console.log(err)
    }
}

const getChunks  = async() => {

}

module.exports={addChunks,deleteChunks}