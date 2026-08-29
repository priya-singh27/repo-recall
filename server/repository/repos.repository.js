const {pool} = require('../db/db_config')


const addRepo = async(user_id, owner, project_name, github_url, status)=>{
    try{
        const {rows} = await pool.query(`
            INSERT INTO repos 
            (user_id, owner, name, github_url, status)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, owner, name)
            DO UPDATE SET updated_at=NOW()
            RETURNING id
            `,[user_id, owner, project_name, github_url,status]
        );
        console.log("Rows from addRepo");
        console.log(rows)
        if(rows.length>=1) return rows[0];

        return null;
    }catch(err){
        console.log(err)
    }
}

const getRepo = async(user_id, owner, project_name)=>{
    try{
        const {rows} = await pool.query(`
            SELECT * FROM repos 
            WHERE user_id=$1 AND owner=$2 AND name=$3
            `,[user_id, owner, project_name]
        );
        console.log("Rows from getRepo");
        console.log(rows)
        if(rows.length>=1) return rows[0];

        return null;
    }catch(err){
        console.log(err)
    }
}

module.exports={
    getRepo,
    addRepo
}