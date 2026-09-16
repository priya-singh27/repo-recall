import { Navigate } from "react-router";
import { useRepo } from "../context/RepoContext";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
const API_URL = import.meta.env.VITE_API_URL;

export default function Chat(){
    const {repoSession} = useRepo();
    const {logout, session} = useAuth();

    if(!repoSession) return <Navigate to="/" replace />

    const [chat, setChat] = useState(null);
    const [formData, setFormData] = useState(null);
    
    const handleInputChange = async (e) => {
        setFormData(e.target.value);
    }

    const handleInputSubmit = async (e) =>{
        e.preventDefault();

        const body = {
            user_input: formData,
            repo_id:repoSession.repo.repo_id
        }

        const res = await fetch(`${API_URL}/chat`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
                Authorization:`Bearer ${session.access_token}`
            },
            body: JSON.stringify(body)

        });

        const data = await res.json();

        console.log(data);
        setChat(data);
    }

    return(
        <>
            <button onClick={()=>{logout()}}>
                Logout
          </button>
            
            <p>{repoSession.owner.name}</p>
            <img src={repoSession.owner.avatar_url}/>
            <h1>{repoSession.repo.name}</h1>
            <h2>Branches: </h2>
            <ul>
            {repoSession.branches.map(item => 
                <li>
                    <h3>Branch Name: {item.name}</h3>
                    <p>sha: {item.commit.url}</p>
                    <p>Branch url: {item.commit.url}</p>
                    <p>{item.protected}</p>
                </li>
            )}
            </ul>
            

            <div>
                <input onChange={handleInputChange} type="text" value={formData} placeholder="Type..." name="user_input"></input>
                <button type="submit" onClick={handleInputSubmit}>Submit</button>
            </div>

            {
                chat && <p>{chat}</p>
            }
        </>
    )
}