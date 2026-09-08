const cache = new Map();

function cacheKey(userId, owner, repo, branch ){
    return `${userId}:${owner}/${repo}:${branch}`
}

function setRepoCache(key,zip,entries_arr){
    cache.set(
        key, 
        {
            zip,
            entries_arr,
            expiresAt: Date.now()+15*60*1000,
        })
}

function getRepoCache(key){
    const hit = cache.get(key);
    if (!hit || Date.now() > hit.expiresAt) {
        cache.delete(key);
        return null;
      }
      return hit;
}

module.exports={
    cacheKey,
    setRepoCache,
    getRepoCache
}