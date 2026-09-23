import { useEffect, useRef, useState } from "react";
import { useRepo } from "../../context/RepoContext";
import { useAuth } from "../../context/AuthContext";
import ReactMarkdown from "react-markdown";
import "./Chat.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function Chat(){
    const {repoSession} = useRepo();
    const { session } = useAuth();

    const [messages, setMessages] = useState([]);
    const [formData, setFormData] = useState("");
    const [sending, setSending] = useState(false);
    const threadRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const thread = threadRef.current;
        if (!thread) return;
        thread.scrollTop = thread.scrollHeight;
    }, [messages]);

    const updateAssistant = (content, sources) => {
        setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role !== "assistant") return prev;
            next[next.length - 1] = { ...last, content, sources };
            return next;
        });
    };
    
    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [formData]);

    const handleInputChange = (e) => {
        setFormData(e.target.value);
    }

    const handleComposerKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
        }
    }

    const handleInputSubmit = async (e) =>{
        e.preventDefault();
        const user_input = formData.trim();
        if (!user_input || sending || !repoSession) return;
        setFormData("");
        setSending(true);

        setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "user", content: user_input },
            { id: crypto.randomUUID(), role: "assistant", content: "", sources: [] },
        ]);

        try {
            const body = {
                user_input,
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

            if (!res.ok || !res.body) {
                updateAssistant("Could not get a reply. Try again.", []);
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let buffer = "";
            let answer = "";
            let sources = [];

            while(true) {
                
                const { value, done } = await reader.read();
                if(done)break;

                buffer += decoder.decode(value, { stream: true });

                const parts = buffer.split("\n\n");
                
                buffer = parts.pop();

                for (const part of parts) {
                    const split_event_data = part.split("\n");
                    if (split_event_data.length < 2) continue;
     
                    const event = split_event_data[0].slice(6).trim();
                    const payload = JSON.parse(split_event_data[1].slice(5).trim());

                    if (event === "sources") sources = payload;
                    if (event === "text") {
                        answer += payload;                                                                                      
                        updateAssistant(answer, sources);
                    }
                    if (event === "done") {
                        updateAssistant(answer, sources);
                    }
                }
            }
        } catch (err) {
            updateAssistant(err.message || "Could not get a reply. Try again.", []);
        } finally {
            setSending(false);
        }
    }

    return(
        <div className="chat">
            <div className="chat__panel">
            {repoSession && (
                <header className="chat__repo">
                    <img className="chat__avatar" src={repoSession.owner.avatar_url} alt="" />
                    <div>
                        <p className="chat__owner">{repoSession.owner.name}</p>
                        <h1>{repoSession.repo.name}</h1>
                    </div>
                </header>
            )}
                <div className="chat__thread" ref={threadRef} aria-live="polite">
                    {messages.length === 0 && (
                        <div className="chat__empty">
                            <img
                                className="chat__bot chat__bot--empty"
                                src="/chat_bot_icon.png"
                                alt=""
                            />
                            <p>
                            {repoSession
                                ? "Ask a question about the indexed files."
                                : "Enter a repo in the sidebar, pick files, and index them to start chatting."}
                            </p>
                        </div>
                    )}
                    {messages.map((message) => (
                        <article
                            key={message.id}
                            className={`chat__message chat__message--${message.role}`}
                        >
                            {message.role === "assistant" && (
                                <img
                                    className="chat__bot"
                                    src="/chat_bot_icon.png"
                                    alt=""
                                />
                            )}
                            <div className="chat__message-body">
                            <p className="chat__role">{message.role === "user" ? "You" : "repo-recall"}</p>
                            {message.role === "user" ? (
                                <p className="chat__bubble">{message.content}</p>
                            ) : (
                                <div className="chat__bubble">
                                    {message.content
                                        ? <ReactMarkdown>{message.content}</ReactMarkdown>
                                        : (
                                          <div className="chat__pending" role="status" aria-label="Waiting for reply">
                                            <span className="chat__pending-tick" />
                                            <span className="chat__pending-tick" />
                                            <span className="chat__pending-tick" />
                                          </div>
                                        )}
                                    {message.sources?.length > 0 && (
                                        <ul className="chat__sources">
                                            {message.sources.map((s) => (
                                                <li key={`${s.path}-${s.start_line}`}>
                                                    {s.path} ({s.start_line}-{s.end_line})
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                            </div>
                        </article>
                    ))}
                </div>

                <form className="chat__composer" onSubmit={handleInputSubmit}>
                    <label className="chat__label" htmlFor="user_input">Message</label>
                    <textarea
                        id="user_input"
                        ref={inputRef}
                        rows={1}
                        onChange={handleInputChange}
                        onKeyDown={handleComposerKeyDown}
                        value={formData}
                        placeholder={repoSession ? "Ask about this repo" : "Index files to chat"}
                        name="user_input"
                        autoComplete="off"
                        disabled={sending || !repoSession}
                    />
                    <button type="submit" disabled={sending || !repoSession || !formData.trim()}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    )
}
