const {addRepo, getRepo} = require('../repository/repos.repository')
const {addChunks, deleteChunks} =require('../repository/chunks.repository');
const parseGithubUrl = require('../utils/github_url_parser.utils');
const downloadRepo = require('../utils/download_repo.utils');
const { cacheKey, setRepoCache, getRepoCache } = require('../utils/repo_cache');
const crypto = require('crypto');
const { getIndexedFile, addIndexedFiles, updateContentHash, getAllIndexedFileForRepo, updateFilesActive, updateActive } = require('../repository/indexed_files.repository');
const { insertPreparedChunks, chunkAndEmbed, EMBED_MODEL } = require('../utils/embed_repo_data');
const { unauthorizedResponse, badRequestResponse, successResponse, serverErrorResponse, externalServiceResponse, goneResponse } = require('../utils/response');
const { pool } = require('../db/db_config');
const { isTextFile } = require('../utils/text_file.utils');

const embed_content = async (req, res) => {
    try {
        const userId = req.user.id;
        const { filesSelected, github_url, branch, repo_id } = req.body;
        if(!github_url || !branch || !filesSelected || !repo_id) return badRequestResponse(res, "Bad Request")

        const  parsed = parseGithubUrl(github_url);
        if(!parsed) return badRequestResponse(res, "Not a valid github url")
        const {repo_name ,owner} =parsed;

        const key = cacheKey(userId, owner, repo_name, branch);
        const cached = getRepoCache(key);
        if (!cached) {
            return goneResponse(res, "Session expired — pick branch again" )
        }
        const { entries_arr } = cached;

        const allExistingIndexedFiles = await getAllIndexedFileForRepo(repo_id);
        const inactiveFiles=[];
        for(const file of allExistingIndexedFiles ?? []){
            const existingFileIsSelected = filesSelected.find(item => item === file.path)
            if(!existingFileIsSelected ) inactiveFiles.push(file.path);
        }

        await updateFilesActive(repo_id, inactiveFiles, false);

        for(const file of filesSelected){
            const entry = entries_arr.find(curr=> curr.path_===file);
            if (!entry || entry.isDir || !isTextFile(file)) continue;

            const indexed_file = await getIndexedFile(repo_id,file);
            
            const content = entry.getContent();
            const curr_content_hash= crypto.createHash('sha256').update(`${EMBED_MODEL}\n${content}`,'utf-8').digest('hex')

            //if the content hash is same
            if (indexed_file && indexed_file.content_hash === curr_content_hash) {
                await updateActive(null, repo_id, file, true);
                continue;
            }

            const prepared = await chunkAndEmbed(content);

            //BEGIN A TRANSACTION 
            const client = await pool.connect();
            try{
                await client.query('BEGIN');

                let fileId;
                 //embed current file path's content if didnt exist
                if(!indexed_file){
                    
                    const row = await addIndexedFiles(client, repo_id, file, true, curr_content_hash);
                    if (!row) throw new Error("Incorrect file selected");
                    fileId = row.id;
                    
                }else{
                    await deleteChunks(client, indexed_file.id);
                    await updateContentHash(client, repo_id, file, curr_content_hash);
                    fileId = indexed_file.id;
                }

                await insertPreparedChunks(client, fileId, prepared);
                await updateActive(client,repo_id, file, true);

                await client.query('COMMIT');
            }catch(err){
                await client.query('ROLLBACK');
                throw err

            }finally{
                client.release();
            }

        }

        return successResponse(res, {}, "Files are embedded and stored successfully")
         
    } catch (err) {
        console.log(err);
        return serverErrorResponse(res, err.message)
        
    }
}

const fecth_repo = async (req, res) => {
    try {
        const github_url = req.body.github_url;
        if(!github_url ) return badRequestResponse(res, "No github url provided")
        const userId = req.user.id;

        const  parsed = parseGithubUrl(github_url);
        if(!parsed) return badRequestResponse(res, "Not a valid github url")
        const {repo_name ,owner} =parsed;

        const repo_data = await fetch(`https://api.github.com/repos/${owner}/${repo_name}`,{
            signal: AbortSignal.timeout(10_000)//If 10 seconds pass and no response has arrived, the AbortSignal fires. JavaScript throws a specific runtime error called an AbortError
        });
        const branches_data = await fetch(`https://api.github.com/repos/${owner}/${repo_name}/branches`,{
            
                signal: AbortSignal.timeout(10_000), 
            }
        );

        if (!repo_data.ok || !branches_data.ok) 
            return externalServiceResponse(res,"Failed to retrieve data from the external service. Please try again later.")

        const repo_json = await repo_data.json();//internally calls JSON.strigify() converts js obj -> json

        const branches_json = await branches_data.json();

        return successResponse(
            res, 
            {
                repo: repo_json,
                branches: branches_json,
            },
            "Successfully retrieved the repository's data"
        )
    } catch (err) {
        console.log(err);
        return serverErrorResponse(res,err.message)
    }

}

const fetch_files = async (req, res) => {
    try {
        const {github_url,branch} = req.body;

        if(!github_url || !branch) return badRequestResponse(res, "No github url provided or no branch selected")
        const userId = req.user.id;

        const  parsed = parseGithubUrl(github_url);
        if(!parsed) return badRequestResponse(res, "Not a valid github url")
        const {repo_name ,owner} =parsed;

        const repo_id = await addRepo(userId, owner, repo_name, github_url, 'pending', branch);
        if(!repo_id){
            return badRequestResponse(res,"Couldn't add repo to db")
            
        }

        const {entries_arr, zip} = await downloadRepo(owner, repo_name, branch);
        if(!entries_arr || !zip){
            return badRequestResponse(res,"Failed to download zip file");
        }

        const key = cacheKey(userId, owner, repo_name, branch);
        setRepoCache(key, zip, entries_arr)

        const files_arr =[];
        for(const entry of entries_arr){
            if (entry.isDir || !isTextFile(entry.path_)) continue;
            files_arr.push({
                path:entry.path_,
                name: entry.name,
                size:entry.size,
                time_modified: entry.time_modified,
                isDir:entry.isDir
            })
        }

        return successResponse(
            res, 
            {
                repo_id: repo_id.id,
                files: files_arr
            },
            "Successfully retrieved the repository's data"
        )

    } catch (err) {
        console.log(err);
        return serverErrorResponse(res,err.message)
    }
}

const fetch_file_content = async (req, res) => {
    try {
        const userId = req.user.id;
        const { github_url, branch, path } = req.body;
        if (!github_url || !branch || !path) return badRequestResponse(res, "Bad Request");

        const parsed = parseGithubUrl(github_url);
        if (!parsed) return badRequestResponse(res, "Not a valid github url");
        const { repo_name, owner } = parsed;

        const cached = getRepoCache(cacheKey(userId, owner, repo_name, branch));
        if (!cached) {
            return goneResponse(res, "Session expired — pull files again");
        }

        const entry = cached.entries_arr.find((item) => item.path_ === path);
        if (!entry || entry.isDir || !isTextFile(path)) {
            return badRequestResponse(res, "File not found");
        }

        const content = entry.getContent();
        const MAX = 200_000;
        const truncated = content.length > MAX;

        return successResponse(
            res,
            {
                path,
                name: entry.name,
                content: truncated ? content.slice(0, MAX) : content,
                truncated,
            },
            "File content retrieved"
        );
    } catch (err) {
        console.log(err);
        return serverErrorResponse(res, err.message);
    }
}

module.exports = {
    fecth_repo,
    fetch_files,
    embed_content,
    fetch_file_content
}

