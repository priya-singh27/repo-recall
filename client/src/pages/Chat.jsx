import { Navigate } from "react-router";
import { useRepo } from "../context/RepoContext";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";

const API_URL = import.meta.env.VITE_API_URL;

export default function Chat(){
    const {repoSession} = useRepo();
    const {logout, session} = useAuth();

    const [chatResponse, setchatResponse] = useState(null);
    const [formData, setFormData] = useState(null);


    if(!repoSession) return <Navigate to="/" replace />
    
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

        const reader = res.body.getReader();// readable stream
        const decoder = new TextDecoder("utf-8");

        let buffer = "";
        let answer = "";
        let sources = [];

        while(true) {
            
            const { value, done } = await reader.read();
            if(done)break;

            buffer += decoder.decode(value, { stream: true });//it means there might be partial utf-8 character at the end of this so remember this

            const parts = buffer.split("\n\n");
            
            buffer = parts.pop(); // leftover incomplete event

            for (const part of parts) {
                const split_event_data = part.split("\n");
                if (split_event_data.length < 2) continue;
 
                const event = split_event_data[0].slice(6).trim();
                const payload = JSON.parse(split_event_data[1].slice(5).trim());

                if (event === "sources") sources = payload;
                if (event === "text") {
                    answer += payload;                                                                                      
                    setchatResponse({ answer, sources }); // live update
                }
                if (event === "done") {
                    setchatResponse({ answer, sources });
                }
            }
        }
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
                chatResponse && <>
                    <div className="answer">
                        <ReactMarkdown>{chatResponse.answer}</ReactMarkdown>
                    </div>
                    <ul>
                        {
                            chatResponse.sources?.map(s => (
                                <li key={`${s.path}-${s.start_line}`}>
                                    {s.path} ({s.start_line}-{s.end_line})
                                </li>
                            ))
                        }
                    </ul>
                </>
            }
        </>
    )
}