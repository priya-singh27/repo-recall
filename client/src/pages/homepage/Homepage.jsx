import {  useState } from "react";
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

    const indexed = Boolean(repoSession);
    const indexedSet = new Set(repoSession?.filesSelected ?? []);
    const previewOpen = Boolean(preview || previewError || loadingPreview);

    const resetWorkspace = () => {
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
      setCurrBranch((current) => current || branches?.[0]?.name || "");
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

    const handleBranchSelect = async () => {
      if (loadingFiles) return;
      setLoadingFiles(true);

      try {
      const body = {
        "github_url":formData.github_url,
        "branch" : currBranch
      }

      const files_response = await fetch(`${API_URL}/repo/files`,{
        method:'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:`Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
      });

      const files = await files_response.json();
      if (!files_response.ok) return;

      const nextFiles = files.data.files;
      const tree = buildTree(nextFiles);
      setFileTree(tree);
      setFilesFetched(files.data);
      setPulledBranch(currBranch);
      setPreview(null);
      setPreviewError("");
      setOpenPath(null);
      setFilesSelected((prev) => prev.filter((path) => nextFiles.some((file) => file.path === path)));
      } finally {
        setLoadingFiles(false);
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
        <div className={`workspace${previewOpen ? " workspace--preview" : ""} workspace--pane-${pane}`}>
          <aside className="workspace__sidebar">
            <section className="homepage__section">
              <form className="homepage__form" onSubmit={handleSubmit}>
                <div className="homepage__url-row">
                  <input
                    onChange={handleInputChange}
                    type="url"
                    placeholder="enter your github url..."
                    name="github_url"
                    value={formData.github_url}
                    disabled={indexed}
                    readOnly={indexed}
                  ></input>
                  {(githubData || filesFetched || indexed) && (
                    <button
                      className="homepage__reset"
                      type="button"
                      onClick={resetWorkspace}
                      aria-label="Reset"
                      title="Reset"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 0 1-8.9 3.1L6.64 17.5A7 7 0 0 0 19 13c0-3.87-3.13-7-7-7z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {!indexed && (!githubData || formData.github_url !== loadedUrl) && (
                  <button type="submit" disabled={loadingBranches}>
                    {loadingBranches ? <Loader label="Loading" /> : "Get Branches"}
                  </button>
                )}
              </form>
            </section>

            {githubData ? <section className="homepage__section">
              <h2>Branch</h2>

              <div className="homepage__branch">
                <select
                  value={currBranch}
                  disabled={indexed}
                  onChange={(e)=>{
                    setCurrBranch(e.target.value)
                  }}>
                  {githubData.branches.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>

                {!indexed && currBranch !== pulledBranch && (
                  <button onClick={handleBranchSelect} type="button" disabled={loadingFiles}>
                    {loadingFiles ? <Loader label="Loading" /> : "Pull Files"}
                  </button>
                )}
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

          <div className="workspace__main">
            <Chat key={indexed ? repoSession.repo.repo_id : "new"} />
          </div>

          {previewOpen && (
            <button
              className="workspace__scrim"
              type="button"
              onClick={closePreview}
              aria-label="Close file preview"
            />
          )}

          {previewOpen && (
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
        </div>
    )
}
