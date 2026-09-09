const fs = require('fs/promises');
const { pool } = require('../db/db_config');
const {addRepo, getRepo} = require('../repository/repos.repository')
const {addChunks, deleteChunks} =require('../repository/chunks.repository');
const parseGithubUrl = require('../utils/github_url_parser.utils');
const downloadRepo = require('../utils/download_repo.utils');
const { cacheKey, setRepoCache, getRepoCache } = require('../utils/repo_cache');

const get_embedding = async (req, res) => {
    try {
        const userId = req.user.id;
        const { filesSelected, github_url, branch } = req.body;

        const {repo_name ,owner} = parseGithubUrl(github_url);

        const key = cacheKey(userId, owner, repo_name, branch);
        const cached = getRepoCache(key);
        if (!cached) {
            return res.status(410).json({ message: "Session expired — pick branch again" });
        }
        const { entries_arr } = cached;

        for(const file of filesSelected){
            const entry = entries_arr.find(curr=> curr.path_===file);
            const content = entry.getContent();
        }

        const repo_row = await getRepo(userId, owner, repo_name);
        if(!repo_row) return res.status(400).json({
            message:"Either user not logged in or provided incorrect github url"
        })

        const existing_chunks = await deleteChunks(repo_row.id);
        if(existing_chunks) {
            console.log("Existing chunk deleted")
        }

        
        // for (let i = 0; i < filesSelected.length; i++) {
        //     const file_js_obj = JSON.parse(filesSelected[i]);
        //     const blobRes = await fetch(file_js_obj.url, {
        //         headers: { 'User-Agent': 'repo-recall' },
        //     });
            

        //     const blob = await blobRes.json();
        //     const text = Buffer.from(blob.content, 'base64').toString('utf-8');

        //     const lines = text.split('\n');
        //     const CHUNK_LINES = 40;
        //     for(let start=0; start<lines.length; start+=CHUNK_LINES){
        //         const end = Math.min(start+CHUNK_LINES, lines.length);
        //         const chunkData = lines.slice(start,end).join('\n');

        //         const ollamaRes = await fetch('http://localhost:11434/api/embeddings', {
        //             method: 'POST',
        //             headers: { 'Content-Type': 'application/json' },
        //             body: JSON.stringify({
        //                 model: 'nomic-embed-text',
        //                 prompt: chunkData,
        //             }),
        //         });
        //         const {embedding} = await ollamaRes.json();// number[] length 768

        //         const chunks_row =await addChunks(repo_row.id, file_js_obj.path, chunkData, start+1, end, JSON.stringify(embedding));
        //     }
            

        // }

        return res.json({
            message:"Files are embedded and stored successfully",
        })

    } catch (err) {
        console.log(err)
    }
}

const fecth_repo = async (req, res) => {
    try {
        const github_url = req.body.github_url;
        const userId = req.user.id;

        const {repo_name ,owner} = parseGithubUrl(github_url);

        const repo_data = await fetch(` https://api.github.com/repos/${owner}/${repo_name}`);
        const branches_data = await fetch(`https://api.github.com/repos/${owner}/${repo_name}/branches`);

        if (!repo_data.ok || !branches_data.ok) {
            return res.status(502).json({
                message: "Failed to retrieve data from the external service. Please try again later."
            });
        }
        const repo_json = await repo_data.json();

        const branches_json = await branches_data.json();

        return res.status(200).json({
            message: "Successfully retrieved the repository's data",
            data: {
                repo: repo_json,
                branches: branches_json,
            }
        })
    } catch (err) {
        console.log(err);
    }

}

const fetch_files = async (req, res) => {
    try {
        const {github_url,branch} = req.body;
        const userId = req.user.id;

        const {repo_name ,owner} = parseGithubUrl(github_url);

        const repo = await addRepo(userId, owner, repo_name, github_url, 'pending', branch);
        console.log(repo);

        const {entries_arr, zip} = await downloadRepo(owner, repo_name, branch);
        const key = cacheKey(userId, owner, repo_name, branch);
        setRepoCache(key, zip, entries_arr)

        const files_arr =[];
        for(const entry of entries_arr){
            files_arr.push({
                path:entry.path_,
                name: entry.name,
                size:entry.size,
                time_modified: entry.time_modified,
                isDir:entry.isDir
            })
        }

        return res.status(200).json({
            message: "Successfully retrieved the repository's data",
            data: {
                files: files_arr
            }
        })
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    fecth_repo,
    fetch_files,
    get_embedding
}

