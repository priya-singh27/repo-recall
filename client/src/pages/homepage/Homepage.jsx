import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import FileTree from "../../components/FileTree/FileTree";
import { useRepo } from "../../context/RepoContext";
import buildTree from "../../utils/buildTree";
import languageFromPath from "../../utils/languageFromPath";
import Chat from "../chat/Chat";
import Loader from "../../components/Loader/Loader";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import './Homepage.css'

const API_URL = import.meta.env.VITE_API_URL;

function restoreGithubData(repoSession) {
  if (!repoSession) return null;
  return {
    repo: {
      name: repoSession.repo.name,
      description: repoSession.repo.description,
      owner: {
        login: repoSession.owner.name,
        name: repoSession.owner.name,
        avatar_url: repoSession.owner.avatar_url,
      },
    },
    branches: repoSession.branches ?? [],
  };
}

export function Homepage(){

    const {repoSession, setRepoSession, clearRepo } = useRepo()
    const {session} = useAuth();

    const [formData, setFormData] = useState({
      github_url: repoSession?.github_url ?? ""
    });
    const [githubData, setGithubData] =useState(() => restoreGithubData(repoSession));
    const [filesFetched, setFilesFetched] = useState(() => (
      repoSession?.files
        ? { files: repoSession.files, repo_id: repoSession.repo.repo_id }
        : null
    ));
    const [currBranch, setCurrBranch] = useState(repoSession?.repo?.curr_branch ?? "")
    const [filesSelected, setFilesSelected] = useState(repoSession?.filesSelected ?? []);
    const [fileTree, setFileTree] = useState(() => (
      repoSession?.files ? buildTree(repoSession.files) : null
    ));
    const [indexing, setIndexing] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [openPath, setOpenPath] = useState(null);
    const [preview, setPreview] = useState(null);
    const [previewError, setPreviewError] = useState("");
    const [pulledBranch, setPulledBranch] = useState(repoSession?.repo?.curr_branch ?? "");
    const [loadedUrl, setLoadedUrl] = useState(repoSession?.github_url ?? "");
    const [pane, setPane] = useState(() => (repoSession ? "chat" : "files"));
    const filesRequestRef = useRef(0);

    const indexed = Boolean(repoSession);
    const indexedSet = new Set(repoSession?.filesSelected ?? []);
    const previewOpen = Boolean(preview || previewError || loadingPreview);

    const resetWorkspace = () => {
      filesRequestRef.current += 1;
      clearRepo();
      setFormData({ github_url: "" });
      setGithubData(null);
      setFilesFetched(null);
      setCurrBranch("");
      setFilesSelected([]);
      setFileTree(null);
      setIndexing(false);
      setOpenPath(null);
      setPreview(null);
      setPreviewError("");
      setPulledBranch("");
      setLoadedUrl("");
      setLoadingBranches(false);
      setLoadingFiles(false);
      setLoadingPreview(false);
      setPane("files");
    };

    const closePreview = () => {
      setPreview(null);
      setPreviewError("");
      setOpenPath(null);
      setLoadingPreview(false);
      setPane("chat");
    };


    const handleInputChange = (e)=>{
      const {name, value} = e.target;
      setFormData((prev)=>({
        ...prev,
        [name]:value
      }))
    }
    
    const pullFiles = async (branch) => {
      if (!branch || indexed) return;
      const request = ++filesRequestRef.current;
      setLoadingFiles(true);
      setCurrBranch(branch);

      try {
        const files_response = await fetch(`${API_URL}/repo/files`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            github_url: formData.github_url,
            branch,
          }),
        });

        const files = await files_response.json();
        if (request !== filesRequestRef.current) return;
        if (!files_response.ok) return;

        const nextFiles = files.data.files;
        setFileTree(buildTree(nextFiles));
        setFilesFetched(files.data);
        setPulledBranch(branch);
        setPreview(null);
        setPreviewError("");
        setOpenPath(null);
        setFilesSelected((prev) =>
          prev.filter((path) => nextFiles.some((file) => file.path === path))
        );
      } finally {
        if (request === filesRequestRef.current) setLoadingFiles(false);
      }
    };

    const handleSubmit = async(e) => {
      e.preventDefault();
      if (loadingBranches) return;
      setLoadingBranches(true);

      try {
      const body={
        "github_url":formData.github_url,
      }
      const response = await fetch(`${API_URL}/repo`,{
        method:'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:`Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
      });
     
      if(!response.ok){
        return;
      }
      const json_data = await response.json();
   
      const branches = json_data["data"].branches;
      setGithubData({
        repo: json_data["data"].repo,
        branches,
      });
      setCurrBranch("");
      setLoadedUrl(formData.github_url);
      setPulledBranch("");
      setFilesFetched(null);
      setFileTree(null);
      setPreview(null);
      setOpenPath(null);
      } finally {
        setLoadingBranches(false);
      }
    }

    const handleFilesSubmit= async()=>{
      if (!filesSelected.length || !filesFetched || indexing) return;
      setIndexing(true);

      try {
      const body={
        filesSelected,
        "github_url":formData.github_url,
        "branch" : currBranch,
        repo_id: filesFetched.repo_id
      }

    const embeddign_res = await fetch(`${API_URL}/repo/index`,{
      method:'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:`Bearer ${session.access_token}`
      },
      body: JSON.stringify(body)
    
    });

      if(!embeddign_res.ok) return;

      const embedding_json = await embeddign_res.json();

      console.log("Embeddign data...")
      console.log(embedding_json);

      setRepoSession({
        github_url:formData.github_url,
        owner: {
          name: githubData.repo.owner.login ?? githubData.repo.owner.name,
          avatar_url: githubData.repo.owner.avatar_url,
        },
        repo: {
          name: githubData.repo.name,
          description: githubData.repo.description,
          repo_id: filesFetched.repo_id,
          curr_branch: currBranch,
        },
        branches: githubData.branches,
        filesSelected,
        files: filesFetched.files,
      });
      setPane("chat");
      } finally {
        setIndexing(false);
      }
    }
    const toggleFile = (path) => {
      if (indexed) return;
      setFilesSelected((prev) =>
        prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
      );
    };

    const openFile = async (path) => {
      setOpenPath(path);
      setPreview(null);
      setPreviewError("");
      setLoadingPreview(true);
      setPane("preview");
      try {
      const response = await fetch(`${API_URL}/repo/file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          github_url: formData.github_url,
          branch: currBranch,
          path,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        setPreview(null);
        setPreviewError(json.message || "Could not open file. Pull files again.");
        return;
      }
      setPreview(json.data);
      } finally {
        setLoadingPreview(false);
      }
    };

    
    return(
        <div className={`workspace${indexed ? "" : " workspace--setup"}${previewOpen ? " workspace--preview" : ""} workspace--pane-${pane}`}>
          <aside className="workspace__sidebar">
            {!indexed && (
              <div className="workspace__setup-hero">
                <img
                  className="workspace__setup-bot"
                  src="/chatbot_icon.png"
                  alt=""
                />
              </div>
            )}
            <section className="homepage__section">
              <form className="homepage__form" onSubmit={handleSubmit}>
                <div className="homepage__url-row">
                  <div className="homepage__field">
                    <svg className="homepage__field-icon" viewBox="0 0 16 16" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-3.5a.25.25 0 0 1-.25-.25Z"
                      />
                    </svg>
                    <input
                      onChange={handleInputChange}
                      type="url"
                      placeholder="https://github.com/owner/repo"
                      name="github_url"
                      value={formData.github_url}
                      aria-label="GitHub repository URL"
                      disabled={indexed}
                      readOnly={indexed}
                    ></input>
                    {(githubData || filesFetched || indexed) && (
                      <button
                        className="homepage__icon-btn"
                        type="button"
                        onClick={resetWorkspace}
                        aria-label="Reset"
                        title="Reset"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                          <path
                            fill="currentColor"
                            d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 0 1-8.9 3.1L6.64 17.5A7 7 0 0 0 19 13c0-3.87-3.13-7-7-7z"
                          />
                        </svg>
                      </button>
                    )}
                    {!indexed && (!githubData || formData.github_url !== loadedUrl) && (
                      <button
                        className="homepage__icon-btn"
                        type="submit"
                        disabled={loadingBranches}
                        aria-label="Get branches"
                        title="Get branches"
                      >
                        {loadingBranches ? (
                          <Loader />
                        ) : (
                          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                            <path
                              fill="currentColor"
                              d="M13.22 7.72a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06L11.44 8.5H3.75a.75.75 0 0 1 0-1.5h7.69L7.66 4.28a.75.75 0 0 1 1.06-1.06l4.5 4.5Z"
                            />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </section>

            {githubData ? <section className="homepage__section">
              <div className="homepage__branch">
                <div className="homepage__field">
                  <svg className="homepage__field-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"
                    />
                  </svg>
                  <select
                    aria-label="Branch"
                    value={currBranch}
                    disabled={indexed}
                    onChange={(e) => {
                      pullFiles(e.target.value);
                    }}>
                    {!indexed && (
                      <option value="" disabled>
                        Select a branch
                      </option>
                    )}
                    {githubData.branches.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                {loadingFiles && <Loader label="Loading files" />}
              </div>
            </section>:"" }

            {
              filesFetched && filesFetched.files ?
              <section className="homepage__section homepage__section--files">
               <h2>Files</h2>
               <p className="homepage__current">
                 {filesSelected.length} selected
               </p>

               {fileTree && (
                  <div className="homepage__files">
                    <FileTree
                      node={fileTree}
                      selected={filesSelected}
                      onToggle={toggleFile}
                      onOpen={openFile}
                      openPath={openPath}
                      readOnly={indexed}
                    />
                  </div>
                )}

               {!indexed && (
                 <button
                   onClick={handleFilesSubmit}
                   type="button"
                   disabled={indexing || filesSelected.length === 0}
                 >
                   {indexing ? <Loader label="Indexing" /> : "Index files"}
                 </button>
               )}
              </section>
              :""
            }
          </aside>

          {indexed && (
          <div className="workspace__main">
            <Chat key={repoSession.repo.repo_id} />
          </div>
          )}

          {indexed && previewOpen && (
            <button
              className="workspace__scrim"
              type="button"
              onClick={closePreview}
              aria-label="Close file preview"
            />
          )}

          {indexed && previewOpen && (
          <aside className="workspace__preview">
            {loadingPreview ? (
              <>
                <header className="workspace__preview-head">
                  <p className="workspace__preview-name">Opening file</p>
                  <button
                    className="workspace__preview-close"
                    type="button"
                    onClick={closePreview}
                    aria-label="Close file"
                  >
                    Close
                  </button>
                </header>
                <div className="workspace__preview-empty">
                  <Loader label="Opening file" />
                </div>
              </>
            ) : preview ? (
              <>
                <header className="workspace__preview-head">
                  <div>
                    <p className="workspace__preview-name">{preview.name}</p>
                    <p className="workspace__preview-path">{preview.path}</p>
                    {!indexedSet.has(preview.path) && (
                      <p className="homepage__current">Not indexed — chat will not use this file.</p>
                    )}
                  </div>
                  <button
                    className="workspace__preview-close"
                    type="button"
                    onClick={closePreview}
                    aria-label="Close file"
                  >
                    Close
                  </button>
                </header>
                <div className="workspace__preview-code">
                  <SyntaxHighlighter
                    language={languageFromPath(preview.path)}
                    style={oneDark}
                    wrapLongLines
                  >
                    {preview.content}
                  </SyntaxHighlighter>
                </div>
                {preview.truncated && (
                  <p className="homepage__current">Showing the first part of this file.</p>
                )}
              </>
            ) : (
              <>
                <header className="workspace__preview-head">
                  <p className="workspace__preview-name">File</p>
                  <button
                    className="workspace__preview-close"
                    type="button"
                    onClick={closePreview}
                    aria-label="Close file"
                  >
                    Close
                  </button>
                </header>
                <p className="workspace__preview-empty">{previewError}</p>
              </>
            )}
          </aside>
          )}

          {indexed && (
          <nav className="workspace__nav" aria-label="Workspace">
            <button
              type="button"
              className={pane === "files" ? "is-active" : ""}
              aria-current={pane === "files" ? "page" : undefined}
              onClick={() => setPane("files")}
            >
              Files
            </button>
            <button
              type="button"
              className={pane === "chat" ? "is-active" : ""}
              aria-current={pane === "chat" ? "page" : undefined}
              onClick={() => setPane("chat")}
            >
              Chat
            </button>
            {previewOpen && (
              <button
                type="button"
                className={pane === "preview" ? "is-active" : ""}
                aria-current={pane === "preview" ? "page" : undefined}
                onClick={() => setPane("preview")}
              >
                File
              </button>
            )}
          </nav>
          )}
        </div>
    )
}
