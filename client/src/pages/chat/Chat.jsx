import { Navigate } from "react-router";
import { useRepo } from "../../context/RepoContext";
import { useEffect, useRef, useState } from "react";
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

    useEffect(() => {
        const thread = threadRef.current;
        if (!thread) return;
        thread.scrollTop = thread.scrollHeight;
    }, [messages]);

    const files = repoSession?.files ?? [];
    const filesSelected = repoSession?.filesSelected ?? [];
    const selectedSet = new Set(filesSelected);
    const indexedFiles = files.length > 0
        ? files.filter((file) => selectedSet.has(file.path))
        : filesSelected.map((path) => ({ path, name: path.split("/").pop() }));
    const otherFiles = files.filter((file) => file.path && !selectedSet.has(file.path));

    if(!repoSession) return <Navigate to="/" replace />

    const updateAssistant = (content, sources) => {
        setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role !== "assistant") return prev;
            next[next.length - 1] = { ...last, content, sources };
            return next;
        });
    };
    
    const handleInputChange = (e) => {
        setFormData(e.target.value);
    }

    const handleInputSubmit = async (e) =>{
        e.preventDefault();
        const user_input = formData.trim();
        if (!user_input || sending) return;
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
            <header className="chat__repo">
                <img className="chat__avatar" src={repoSession.owner.avatar_url} alt="" />
                <div>
                    <p className="chat__owner">{repoSession.owner.name}</p>
                    <h1>{repoSession.repo.name}</h1>
                </div>

                <span className="chat__branch">{repoSession.repo.curr_branch}</span>
            </header>

            <div className="chat__body">
                <aside className="chat__files">
                    <h2>Indexed files</h2>
                    <p className="chat__files-count">
                        {indexedFiles.length} file{indexedFiles.length === 1 ? "" : "s"}
                    </p>
                    {indexedFiles.length === 0 ? (
                        <p className="chat__files-count">No files indexed for this chat.</p>
                    ) : (
                        <ul className="chat__file-list">
                            {indexedFiles.map((file) => (
                                <li key={file.path} className="chat__file chat__file--indexed">
                                    <span className="chat__file-name">{file.name || file.path.split("/").pop()}</span>
                                    <span className="chat__file-path">{file.path}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {otherFiles.length > 0 && (
                        <>
                            <h2 className="chat__files-sub">Not indexed</h2>
                            <ul className="chat__file-list">
                                {otherFiles.map((file) => (
                                    <li key={file.path} className="chat__file">
                                        <span className="chat__file-name">{file.name || file.path.split("/").pop()}</span>
                                        <span className="chat__file-path">{file.path}</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </aside>

            <div className="chat__panel">
                <div className="chat__thread" ref={threadRef} aria-live="polite">
                    {messages.length === 0 && (
                        <p className="chat__empty">Ask a question about this repo.</p>
                    )}
                    {messages.map((message) => (
                        <article
                            key={message.id}
                            className={`chat__message chat__message--${message.role}`}
                        >
                            <p className="chat__role">{message.role === "user" ? "You" : "repo-recall"}</p>
                            {message.role === "user" ? (
                                <p className="chat__bubble">{message.content}</p>
                            ) : (
                                <div className="chat__bubble">
                                    {message.content
                                        ? <ReactMarkdown>{message.content}</ReactMarkdown>
                                        : <p className="chat__pending">Thinking…</p>}
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
                        </article>
                    ))}
                </div>

                <form className="chat__composer" onSubmit={handleInputSubmit}>
                    <label className="chat__label" htmlFor="user_input">Message</label>
                    <input
                        id="user_input"
                        onChange={handleInputChange}
                        type="text"
                        value={formData}
                        placeholder="Ask about this repo"
                        name="user_input"
                        autoComplete="off"
                        disabled={sending}
                    />
                    <button type="submit" disabled={sending || !formData.trim()}>
                        {sending ? "Sending" : "Send"}
                    </button>
                </form>
            </div>
            </div>
        </div>
    )
}
