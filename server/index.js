const express = require('express');
const app = express();
const dotenv = require('dotenv').config();

const {pool} = require('./db/db_config');



process.on('SIGINT', async ()=>{
    await pool.end();
    console.log('Connection pool is being disconnected..')
    process.exit(0);
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>{
    console.log(`Listening on ${PORT}`)
});