const {pool} = require('../db/db_config');

const addIndexedFiles = async (repo_id, path, active, content_hash) =>{
    try{
        const {rows} = await pool.query(
            `
               INSERT INTO indexed_files
               (repo_id, path, active, content_has)
               VALUES ($1, $2, $3, $4)
               DO UPDATE SET updated_at=NOW()
               RETURNING id
            `,
            [repo_id, path, active, content_hash]
        );

        console.log("It's from addIndexedFiles");
        console.log(rows)
        if(rows.length>0) return rows[0];

        return null;
    }catch(err){
        console.log(err);
    }
}

module.exports={
    addIndexedFiles
}