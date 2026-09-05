const fs = require('fs/promises');
const { pool } = require('../db/db_config');
const {addRepo, getRepo} = require('../repository/repos.repository')
const {addChunks, deleteChunks} =require('../repository/chunks.repository');
const parseGithubUrl = require('../utils/github_url_parser.utils');
const downloadRepo = require('../utils/download_repo.utils');

const get_embedding = async (req, res) => {
    try {
        const userId = req.user.id;
        const { filesSelected, github_url } = req.body;

        const {repo_name ,owner} = parseGithubUrl(github_url);

        const repo_row = await getRepo(userId, owner, repo_name);
        if(!repo_row) return res.status(400).json({
            message:"Either user not logged in or provided incorrect github url"
        })

        console.log("Repo row: ")
        console.log(repo_row);

        const existing_chunks = await deleteChunks(repo_row.id);
            if(existing_chunks) {
                console.log("Existing chunk deleted")
            }
        for (let i = 0; i < filesSelected.length; i++) {
            const file_js_obj = JSON.parse(filesSelected[i]);
            const blobRes = await fetch(file_js_obj.url, {
                headers: { 'User-Agent': 'repo-recall' },
            });
            

            const blob = await blobRes.json();
            const text = Buffer.from(blob.content, 'base64').toString('utf-8');

            const lines = text.split('\n');
            const CHUNK_LINES = 40;
            for(let start=0; start<lines.length; start+=CHUNK_LINES){
                const end = Math.min(start+CHUNK_LINES, lines.length);
                const chunkData = lines.slice(start,end).join('\n');

                const ollamaRes = await fetch('http://localhost:11434/api/embeddings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'nomic-embed-text',
                        prompt: chunkData,
                    }),
                });
                const {embedding} = await ollamaRes.json();// number[] length 768

                const chunks_row =await addChunks(repo_row.id, file_js_obj.path, chunkData, start+1, end, JSON.stringify(embedding));
            }
            

        }

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
            })
        }
        const repo_json = await repo_data.json();

        const repo = await addRepo(userId, owner, repo_name, github_url, 'pending');
        console.log(repo);

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

        const github_url = req.body.github_url;
        const branch = req.body.branch;

        const {repo_name ,owner} = parseGithubUrl(github_url);

        await downloadRepo(owner, repo_name, branch);

        const files_data = await fetch(`https://api.github.com/repos/${owner}/${repo_name}/git/trees/${branch}?recursive=1`);
        
        

        if (!files_data.ok) {
            return res.status(502).json({
                message: "Failed to retrieve data from the external service. Please try again later."
            })
        }

        const files_json = await files_data.json();

        await fs.writeFile('./logs/files.txt', JSON.stringify(files_json.tree));

        return res.status(200).json({
            message: "Successfully retrieved the repository's data",
            data: {
                files: files_json
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

