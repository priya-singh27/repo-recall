const fs = require('fs/promises');


const get_embedding = async (req,res) => {
    try{
        const {filesSelected} = req.body;

        console.log(filesSelected);
        const embeddings = [];
        for(let i=0; i<filesSelected.length; i++){
            console.log(filesSelected[i])
            const file_js_obj = JSON.parse(filesSelected[i]);
            const blobRes  = await fetch(file_js_obj.url,{
                headers: { 'User-Agent': 'repo-recall' },
              });

              const blob = await blobRes.json();

              const text = Buffer.from(blob.content, 'base64').toString();

              const ollamaRes = await fetch('http://localhost:11434/api/embeddings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: 'nomic-embed-text',
                  prompt: text,
                }),
              });

              console.log(ollamaRes);

              const { embedding } = await ollamaRes.json();// number[] length 768
              console.log(embedding)
                embeddings.push({ url: filesSelected[i], embedding });   

        }

        return res.json({
            data: embeddings
        })
        
    }catch(err){
        console.log(err)
    }
}

const fecth_repo = async (req, res) => {
    try{
        console.log("Received req..");
        const github_url = req.body.github_url;
        console.log(github_url)

        const arr = github_url.split("/");
        console.log(arr)
        if(arr.length<4){
            return res.status(400).json({
                message: "Invalid github url provided, could you please check the format. It should be in this format: https://github.com/{owner}/{name}"
            });
        }
        const owner =  arr[4];
        const project_name = arr[5];//https://api.github.com/repos/priya-singh27/indiaml-tracker

        const repo_data = await fetch(` https://api.github.com/repos/${owner}/${project_name}`);
        const branches_data = await fetch(`https://api.github.com/repos/${owner}/${project_name}/branches`);

        
        if(!repo_data.ok || !branches_data.ok){
            return res.status(502).json({
                message:"Failed to retrieve data from the external service. Please try again later."
            })
        }
        const repo_json  = await repo_data.json();
        const branches_json = await branches_data.json();
        

        // console.log(repo_json);
        // console.log(branches_json);


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
        console.log(req.body);
        const github_url = req.body.github_url;
        const branch = req.body.branch;
        
        const arr = github_url.split("/");
        if(arr.length<4){
            return res.status(400).json({
                message: "Invalid github url provided, could you please check the format. It should be in this format: https://github.com/{owner}/{name}"
            });
        }
        const owner =  arr[4];
        const project_name = arr[5];

        console.log("Making api call to fetch files...")
        const files_data = await fetch(
            `https://api.github.com/repos/${owner}/${project_name}/git/trees/${branch}?recursive=1`);

        console.log("Received responseP: ");
        console.log(files_data);
        if(!files_data.ok){
            return res.status(502).json({
                message:"Failed to retrieve data from the external service. Please try again later."
            })
        }
    
        const files_json = await files_data.json();
        console.log("Files fetched successfully....")

        console.log(files_json);
        await fs.writeFile('./logs/files.txt', JSON.stringify(files_json.tree));

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

