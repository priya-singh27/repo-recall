const express = require('express');
const app = express();
const dotenv = require('dotenv').config();

const {pool} = require('./db/db_config');
app.use(express.json());
app.use(express.urlencoded({extended:true}));


const repo_router = require('./routes/repos');

app.use('/repo', repo_router);


process.on('SIGINT', async ()=>{
    await pool.end();
    console.log('Connection pool is being disconnected..')
    process.exit(0);
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>{
    console.log(`Listening on ${PORT}`)
});