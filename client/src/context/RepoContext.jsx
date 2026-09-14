import {createContext, useContext, useState} from "react";

const RepoContext = createContext(null);


export function RepoProvider({children}){
    const [repoSession, setRepoSession] = useState(null);
    
    function clearRepo(){
        setRepoSession(null);
    }

    return (
        <RepoContext.Provider value={{repoSession, setRepoSession, clearRepo}}>
            {children}
        </RepoContext.Provider>
    );
}

export function useRepo(){
    const ctx = useContext(RepoContext);
    if(!ctx) throw new Error("useRepo must be used inside RepoProvider");
    return ctx;
}