
const get_embedding = async (req,res) => {
    try{
        const {content_base_64} = req.body;
        const CHUNK_SIZE =4;
        const buff = new Buffer(content_base_64, "base64").toString("utf-8");
        console.log(buff);

        return res.json({
            data: buff
        })
        
    }catch(err){
        console.log(err)
    }
}

const fecth_repo = async (req, res) => {
    try{
        console.log("Received req..");
        const github_url = req.body.github_url;

        const arr = github_url.split("/");
        if(arr.length<4){
            return res.status(400).json({
                message: "Invalid github url provided, could you please check the format. It should be in this format: https://github.com/{owner}/{name}"
            });
        }
        const owner =  arr[3];
        const project_name = arr[4];

        const repo_data = await fetch(` https://api.github.com/repos/${owner}/${project_name}`);
        const branches_data = await fetch(`https://api.github.com/repos/${owner}/${project_name}/branches`);

        
        if(!repo_data.ok || !branches_data.ok){
            return res.status(502).json({
                message:"Failed to retrieve data from the external service. Please try again later."
            })
        }
        const repo_json  = await repo_data.json();
        const branches_json = await branches_data.json();
        

        console.log(repo_json);
        console.log(branches_json);


        return res.status(200).json({
            message:"Successfully retrieved the repository's data",
            data: {
                repo:repo_json,
                branches: branches_json,
            }
        })
    }catch(err){
        console.log(err);
    }

}

const fetch_files = async (req, res) => {
    try{
        console.log("Received req..");
        const github_url = req.body.github_url;
        const branch = req.body.brnach;
        
        const arr = github_url.split("/");
        if(arr.length<4){
            return res.status(400).json({
                message: "Invalid github url provided, could you please check the format. It should be in this format: https://github.com/{owner}/{name}"
            });
        }
        const owner =  arr[3];
        const project_name = arr[4];

        const files_data = await fetch(
            `https://api.github.com/repos/${owner}/${project_name}/git/trees/${branch}?recursive=1`);

        
        if(!files_data.ok){
            return res.status(502).json({
                message:"Failed to retrieve data from the external service. Please try again later."
            })
        }
    
        const files_json = await files_data.json();

        console.log(files_json);

        return res.status(200).json({
            message:"Successfully retrieved the repository's data",
            data: {
                files: files_json
            }
        })
    }catch(err){
        console.log(err);
    }
}

module.exports={
    fecth_repo,
    fetch_files,
    get_embedding
}

