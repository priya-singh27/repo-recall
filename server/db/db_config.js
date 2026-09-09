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
   github_url TEXT NOT NULL,
   branch TEXT NOT NULL,
   status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'indexing', 'ready', 'failed')),
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   UNIQUE (user_id, owner, name, branch)
);
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS indexed_files(
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   repo_id UUID NOT NULL REFERENCES repos(id) ON UPDATE CASCADE ON DELETE CASCADE,
   path TEXT NOT NULL,
   active BOOLEAN NOT NULL DEFAULT true,
   content_hash TEXT,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   UNIQUE (repo_id, path)
);

CREATE TABLE IF NOT EXISTS chunks (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   indexed_file_id UUID NOT NULL REFERENCES indexed_files(id) ON UPDATE CASCADE ON DELETE CASCADE,
   start_line INTEGER,
   end_line INTEGER,
   content TEXT,
   embedding VECTOR(768) NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_indexed_files_repo_active ON indexed_files (repo_id) WHERE active=true;
CREATE INDEX IF NOT EXISTS idx_chunks_indexed_file_id ON  chunks (indexed_file_id)
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