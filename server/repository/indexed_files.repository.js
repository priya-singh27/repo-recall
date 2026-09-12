const {pool} = require('../db/db_config');

const addIndexedFiles = async (repo_id, path, active, content_hash) =>{
    try{
        const {rows} = await pool.query(
            //EXCLUDED is the row i tried to insert but a row with the combination of repo_id an path already exists so we'll update the content hash
            `
               INSERT INTO indexed_files
               (repo_id, path, active, content_hash)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (repo_id, path) DO UPDATE
               SET content_hash = EXCLUDED.content_hash,
                updated_at = NOW()
               RETURNING id
            `,
            [repo_id, path, active, content_hash]
        );

        console.log("It's from addIndexedFiles");
        console.log(rows);
        if(rows.length>0) return rows[0];

        return null;
    }catch(err){
        console.log(err);
    }
}

const updateContentHash = async(repo_id,path,content_hash)=>{
    try{
        const {rows} = await pool.query(
            `
             UPDATE indexed_files 
             SET content_hash=$1
             WHERE repo_id=$2 AND path=$3
             RETURNING id
            `,[content_hash, repo_id,path]
        );

        if(rows.length>0) return rows[0];

        return null;
    }catch(err){
        console.log(err)
    }
}

const getIndexedFile = async(repo_id, path) => {
    try{
        const {rows} = await pool.query(
            `
                SELECT * FROM indexed_files
                WHERE repo_id=$1 AND path=$2
            `,
            [repo_id, path]
        );

        console.log("It's from getIndexedFile");
        console.log(rows);

        if(rows.length>0) return rows[0];
        return null;
    }catch(err){
        console.log(err)
    }
}

const getAllIndexedFileForRepo = async(repo_id) => {
    try{
        const {rows} = await pool.query(
            `
                SELECT path FROM indexed_files
                WHERE repo_id=$1 
            `,
            [repo_id]
        );

        console.log("It's from getIndexedFile");
        console.log(rows);

        if(rows.length>0) return rows;
        return null;
    }catch(err){
        console.log(err)
    }
}

module.exports={
    addIndexedFiles,
    getIndexedFile,
    updateContentHash,
    getAllIndexedFileForRepo
}