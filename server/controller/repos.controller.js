const fs = require('fs/promises');
const { pool } = require('../db/db_config');
const {addRepo, getRepo} = require('../repository/repos.repository')
const {addChunks, deleteChunks} =require('../repository/chunks.repository');
const parseGithubUrl = require('../utils/github_url_parser.utils');
const downloadRepo = require('../utils/download_repo.utils');
const { cacheKey, setRepoCache, getRepoCache } = require('../utils/repo_cache');
const crypto = require('crypto');
const { getIndexedFile, addIndexedFiles, updateContentHash, getAllIndexedFileForRepo, updateActive } = require('../repository/indexed_files.repository');
const { embed_file } = require('../utils/embed_data');

const embed_content = async (req, res) => {
    try {
        const userId = req.user.id;
        const { filesSelected, github_url, branch, repo_id } = req.body;

        console.log(`Printing req.body of embed_content`);
        console.log(repo_id)

        const {repo_name ,owner} = parseGithubUrl(github_url);

        const key = cacheKey(userId, owner, repo_name, branch);
        const cached = getRepoCache(key);
        if (!cached) {
            return res.status(410).json({ message: "Session expired — pick branch again" });
        }
        const { entries_arr } = cached;

        const allExistingIndexedFiles = await getAllIndexedFileForRepo(repo_id);
        const inactiveFiles=[];
        for(const file of allExistingIndexedFiles ?? []){
            const existingFileIsSelected = filesSelected.find(item => item === file.path)
            if(!existingFileIsSelected ) inactiveFiles.push(file.path);
        }

        await updateActive(repo_id, inactiveFiles, false);

        for(const file of filesSelected){
            const entry = entries_arr.find(curr=> curr.path_===file);
            if (!entry || entry.isDir) continue;

            const content = entry.getContent();
            const curr_content_hash= crypto.createHash('sha256').update(content,'utf-8').digest('hex')

            const indexed_file = await getIndexedFile(repo_id,file);

             //embed current file path's content if either content of the file changed or didnt exist
            if(!indexed_file){

                const indexed_file_row = await addIndexedFiles(repo_id, file, true, curr_content_hash);
                if(!indexed_file_row) return res.status(400).json({
                    message:`Couldn't add ${file} to the indexed files table`
                });
                await embed_file(indexed_file_row.id, content);//this throws error and goes to catch block
                
            }else{
                console.log(indexed_file);
                const stored_content_hash = indexed_file.content_hash;
                if(stored_content_hash!==curr_content_hash){
                   
                    const existing_chunks = await deleteChunks(indexed_file.id);
                    await embed_file(indexed_file.id, content);
                    await updateContentHash(repo_id,file,curr_content_hash);
                }
            }

        }

        return res.json({
            message:"Files are embedded and stored successfully",
        })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: err.message});
        
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
        return res.status(500).json({ message: err.message});
    }

}

const fetch_files = async (req, res) => {
    try {
        const {github_url,branch} = req.body;
        const userId = req.user.id;

        const {repo_name ,owner} = parseGithubUrl(github_url);

        const repo_id = await addRepo(userId, owner, repo_name, github_url, 'pending', branch);
        if(!repo_id){
            return res.status(400).json({
                message:"Couldn't add repo to db"
            })
        }

        const {entries_arr, zip} = await downloadRepo(owner, repo_name, branch);
        if(!entries_arr || !zip){
            return res.status(400).json({
                message:"Failed to download zip file"
            })
        }
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
                repo_id,
                files: files_arr
            }
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message});
    }
}

module.exports = {
    fecth_repo,
    fetch_files,
    embed_content
}

