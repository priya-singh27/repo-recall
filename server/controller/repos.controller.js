const fecth_repo = async (req, res) => {
    try{
        console.log("Received req..");
        const github_url = req.body.github_url;
        //https://github.com/priya-singh27/az-assistant
        const arr = github_url.split("/");
        if(arr.length<4){
            return res.status(400).json({
                message: "Invalid github url provided, could you please check the format. It should be in this format: https://github.com/{owner}/{name}"
            });
        }
        const owner =  arr[3];
        const project_name = arr[4];
        console.log(arr)
        console.log(owner);
        console.log(project_name)

        const repo_data = await fetch(` https://api.github.com/repos/${owner}/${project_name}`);
        const branches_data = await fetch(`https://api.github.com/repos/${owner}/${project_name}/branches`);
        const files_data =await fetch(`https://api.github.com/repos/${owner}/${project_name}/git/trees/main?recursive=1`);

        
        if(!repo_data.ok || !branches_data.ok || !files_data.ok){
            return res.status(502).json({
                message:"Failed to retrieve data from the external service. Please try again later."
            })
        }
        const repo_json  = await repo_data.json();
        const branches_json = await branches_data.json();
        const files_json = await files_data.json();

        console.log(repo_json);
        console.log(branches_json);
        console.log(files_json);

        return res.status(200).json({
            message:"Successfully retrieved the repository's data",
            data: {
                repo:repo_json,
                branches: branches_json,
                files: files_json
            }
        })
    }catch(err){
        console.log(err);
    }

}

module.exports={
    fecth_repo
}

