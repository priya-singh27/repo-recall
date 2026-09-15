import { Navigate } from "react-router";
import { useRepo } from "../context/RepoContext";
import { useState } from "react";
import { useEffect } from "react";

export default function Chat(){
    const {repoSession} = useRepo();

    if(!repoSession) return <Navigate to="/" replace />

    const [chat, setChat] = useState(null);
    const [formData, setFormData] = useState(null);
    

    const handleInputChange = () =>{
        
    }

    return(
        <>
            
            <p>{repoSession.owner.name}</p>
            <img src={repoSession.owner.avatar_url}/>
            <h1>{repoSession.repo.name}</h1>
            <h2>Branches: </h2>
            {repoSession.branches.map(item => 
                <>
                    <h3>Branch Name: {item.name}</h3>
                    <p>sha: {item.commit.url}</p>
                    <p>Branch url: {item.commit.url}</p>
                    <p>{item.protected}</p>
                </>
            )}

            <div>
                <input onChange={handleInputChange} type="text" value={formData} placeholder="Type..." name="user_input"></input>
                <input type="submit"></input>
            </div>
        </>
    )
}