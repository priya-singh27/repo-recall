import {  useState } from "react";
import { useAuth } from "../../context/AuthContext";
import FileTree from "../../components/FileTree/FileTree";
import { useRepo } from "../../context/RepoContext";
import { useNavigate } from "react-router";
import buildTree from "../../utils/buildTree";
import './Homepage.css'

const API_URL = import.meta.env.VITE_API_URL;


export function Homepage(){

    const {setRepoSession } = useRepo()
    const {session} = useAuth();

    const [formData, setFormData] = useState({
      github_url:""
    });
    const [githubData, setGithubData] =useState(null);
    const [filesFetched, setFilesFetched] = useState(null);
    const [currBranch, setCurrBranch] = useState("")
    const [filesSelected, setFilesSelected] = useState([]);
    const [fileTree, setFileTree] = useState(null);

    const navigate = useNavigate();


    const handleInputChange = (e)=>{
      const {name, value} = e.target;
      setFormData((prev)=>({
        ...prev,
        [name]:value
      }))
    }
    
    const handleSubmit = async(e) => {
      e.preventDefault();

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
    }

    const handleBranchSelect = async () => {

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

      const tree = buildTree(files.data.files);
      setFileTree(tree);
   
      setFilesFetched(files.data); 
    }

    const handleFilesSubmit= async()=>{
      // console.log("Files fetched: ");
      // console.log(filesFetched);

      // console.log("Github Data")
      // console.log(githubData);

      // console.log("Files selected")
      // console.log(filesSelected);
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
        
        filesSelected,
        files: filesFetched.files,
      });

      navigate('/chat');

    }
    const toggleFile = (path) => {
      setFilesSelected((prev) =>
        prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
      );
    };

    
    return(
        <div className="homepage">

          <section className="homepage__section">
            <form className="homepage__form" onSubmit={handleSubmit}>
              <input onChange={handleInputChange} type="url" placeholder="enter your github url..." name="github_url" value={formData.github_url}></input>
              <button type="submit">Get Branches</button>
            </form>
          </section>

          {githubData ? <section className="homepage__section">
            <h2>Branches</h2>

            <div className="homepage__branch">
              <select
                value={currBranch}
                onChange={(e)=>{
                  setCurrBranch(e.target.value)
                }}>
                {githubData.branches.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>

              <button onClick={handleBranchSelect} type="button">Pull Files</button>
            </div>
          </section>:"" }

          {
            filesFetched && filesFetched.files ?
            <section className="homepage__section">
             <h2>Files</h2>

             {fileTree && (
                <div className="homepage__files">
                  <FileTree
                    node={fileTree}
                    selected={filesSelected}
                    onToggle={toggleFile}
                  />
                </div>
              )}

             <button onClick={handleFilesSubmit} type="button">Submit</button>
            </section>
            :""
          }

        {currBranch?
          <p className="homepage__current">Current branch: {currBranch}</p>
        :""}

        </div>

       
    )
}