const {exec} = require('node:child_process');
const AdmZip = require("adm-zip");

const downloadRepo = async (owner, repo_name, branch) => {

    try{
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo_name}/zipball/${branch}`,
            {headers:{'User-Agent':'repo-recall'}, redirect:'follow'}
        );

        console.log(res);
        const ab = await res.arrayBuffer();//type ab which means a block of memory 
        const bytes = await Buffer.from(ab);//Buffer is extension of UInt8Array which has some addition methods

        const zip = new AdmZip(bytes); 
        console.log("After new AdmZip")
        console.log(zip)
        const arrEntry = zip.getEntries();

        console.log(arrEntry[1].isDirectory)
        console.log(arrEntry[1].name);
        console.log(arrEntry[1].getData())
        console.log((new Date(arrEntry[1].header.toJSON()["time"])).toLocaleString());



        // console.log(arrEntry[3].name);

        // arrEntry.forEach(item=>{

        //     console.log(item)
        //     console.log('\n');
        // })
        return;

    }catch(err){
        console.log("From downloadRepo...")
        console.log(err)
    }
}

module.exports= downloadRepo;

