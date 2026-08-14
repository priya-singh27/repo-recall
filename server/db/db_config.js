const pg = require('pg');
const dotenv = require('dotenv').config();

const pool = new pg.Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
    max:10
});

const createTable = `


CREATE TABLE IF NOT EXISTS repos(
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id  UUID NOT NULL REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
   owner VARCHAR(255),
   name VARCHAR(255),
   github_url TEXT,
   status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'indexing', 'ready', 'failed')),
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   UNIQUE (user_id, owner, name)
);
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS chunks (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   repo_id UUID NOT NULL REFERENCES repos(id) ON UPDATE CASCADE ON DELETE CASCADE,
   path TEXT,
   start_line INTEGER,
   end_line INTEGER,
   content TEXT,
   embedding VECTOR(1536) NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

(
    async function() {
        let client;
       try{
             client = await pool.connect();
            console.log(`DB connected...`);
            const result = await client.query(createTable);
            // console.log(result.rows[0])
            console.log(`Tables created...`);
       }catch(err){
            console.log(err)
       }finally{
            client.release();
       }
    }
)()

module.exports = {
    pool
}