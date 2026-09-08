const AdmZip = require("adm-zip");

const downloadRepo = async (owner, repo_name, branch) => {

    try{
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo_name}/zipball/${branch}`,
            {headers:{'User-Agent':'repo-recall'}, redirect:'follow'}
        );

        console.log(res);
        const ab = await res.arrayBuffer();//type ab which means a block of memory 
        const bytes = Buffer.from(ab);//Buffer is extension of Uint8Array which has some addition methods

        const zip = new AdmZip(bytes); //read the zip and lazyload the content on demand

        const entries = zip.getEntries();
        const root_prefix = entries[0].entryName.split('/')[0]+'/';

        const entries_arr =[];
        for(const entry of entries){
            const path = entry.entryName.slice (root_prefix.length);
            entries_arr.push({
                name:entry.name,
                path_:path,
                size: entry.header.size,
                time_modified:((new Date (entry.header.toJSON()["time"])).toLocaleString()),
                isDir: entry.isDirectory,
                getContent: ()=> zip.readAsText(entry, 'utf8'),
            })
        }

        return {entries_arr, zip};

    }catch(err){
        console.log("From downloadRepo...")
        console.log(err)
    }
}

const getEntriesData=(entries)=>{
   for(const entry of entries){
      const text_content = entry.getContent();

   }
}

module.exports= downloadRepo;

