const parseGithubUrl = (repo_url) => {
    let url;
    try{
        url = new URL(repo_url.trim());
        const parts = url.pathname.split("/").filter(Boolean);

        let owner, repo_name;
        if(url.hostname === 'github.com' || url.hostname==="www.github.com"){
            if(parts.length<2) return null;

            owner = parts[0];
            repo_name = parts[1];
        }else if(url.hostname === "api.github.com"){

            if (parts[0] !== 'repos' || parts.length < 3) return null;
            owner = parts[1];
            repo_name = parts[2];
        }else 
            return null;

        repo_name = repo_name.replace(/\.git$/i,'');

        return {owner, repo_name};
    }catch(err){
        return null;
    }
}

module.exports = parseGithubUrl;