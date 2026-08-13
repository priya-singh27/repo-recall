const pg = require('pg');
const dotenv = require('dotenv').config();

const pool = new pg.Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
    max:10
});

(
    async function() {
       try{
            const client = await pool.connect();
            const result = await client.query('SELECT NOW()');
            // console.log(result.rows[0])
            console.log(`DB connected...`)
            client.release();
       }catch(err){
            console.log(err)
       }
    }
)()

module.exports = {
    pool
}