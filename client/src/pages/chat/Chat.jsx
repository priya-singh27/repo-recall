import { Navigate } from "react-router";
import { useRepo } from "../../context/RepoContext";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ReactMarkdown from "react-markdown";
import "./Chat.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function Chat(){
    const {repoSession} = useRepo();
    const { session } = useAuth();

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
        <div className="chat">
            <header className="chat__repo">
                <img className="chat__avatar" src={repoSession.owner.avatar_url} alt="" />
                <div>
                    <p className="chat__owner">{repoSession.owner.name}</p>
                    <h1>{repoSession.repo.name}</h1>
                </div>

                <span className="chat__branch">{repoSession.repo.curr_branch}</span>
            </header>

            <section className="chat__section">
                
                
            </section>

            <form className="chat__composer" onSubmit={handleInputSubmit}>
                <input onChange={handleInputChange} type="text" value={formData ?? ""} placeholder="Ask about this repo" name="user_input"></input>
                <button type="submit">Submit</button>
            </form>

            {
                chatResponse && <>
                    <div className="chat__answer">
                        <ReactMarkdown>{chatResponse.answer}</ReactMarkdown>
                    </div>
                    <ul className="chat__sources">
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
        </div>
    )
}