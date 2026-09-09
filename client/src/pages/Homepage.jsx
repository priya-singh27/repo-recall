import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import FileTree from "../components/FileTree";

const API_URL = import.meta.env.VITE_API_URL;

export default function Homepage(){

    const {logout,session} = useAuth();
    const [formData, setFormData] = useState({
      github_url:""
    });
    const [githubData, setGithubData] =useState(null);
    const [filesFetched, setFilesFetched] = useState(null);
    const [currBranch, setCurrBranch] = useState(null);
    const [filesSelected, setFilesSelected] = useState([]);
    const [fileTree, setFileTree] = useState(null);


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
      const response = await fetch(`${API_URL}/repo/details`,{
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
   
      setGithubData({
        repo: json_data["data"].repo,
        branches: json_data["data"].branches,
      });
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
      setFilesFetched(files.data.files); 
    }

    // const handleFileSelect = (e)=>{
    //   console.log(e.target.options);
    //   const selectedOptions = Array.from(e.target.options)
    //   .filter(option => option.selected)
    //   .map(option => option.value);
      
    //   console.log("Selected options: ")
    //   setFilesSelected(selectedOptions);
    //   console.log(selectedOptions);
    // }

    const handleFilesSubmit= async()=>{
      console.log("Files selected: ");
      console.log(filesSelected)
      const body={
        filesSelected,
        "github_url":formData.github_url,
        "branch" : currBranch
      }

      const embeddign_res = await fetch(`${API_URL}/repo/index`,{
        method:'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:`Bearer ${session.access_token}`
        },
        body: JSON.stringify(body)
      });

      const embedding_json = await embeddign_res.json();

      console.log("Embeddign data...")
      console.log(embedding_json);

    }
    const toggleFile = (path) => {
      setFilesSelected((prev) =>
        prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
      );
    };

    function buildTree(files) {
      const root = { name: "", children: {}, files: [] };
    
      for (const item of files) {
        if (item.isDir) continue;
    
        const parts = item.path.split("/").filter(Boolean);
        let node = root;
    
        // walk/create folder nodes
        for (let i = 0; i < parts.length - 1; i++) {
          const folder = parts[i];
          if (!node.children[folder]) {
            node.children[folder] = { name: folder, children: {}, files: [] };
          }
          node = node.children[folder];
        }
    
        node.files.push(item);
      }

      console.log("Root")
      console.log(root);
    
      return root;
    }

    
    return(
        <>
          
          <button onClick={()=>{logout()}}>
            Logout
          </button>

          <div>
            <form onSubmit={handleSubmit}>
              <input onChange={handleInputChange} type="url" placeholder="enter your github url..." name="github_url" value={formData.github_url}></input>
              <button type="submit">Scan Repo</button>
            </form>
          
          </div>

          {githubData ? <div>
            <h2>Branches:</h2>

            
            <select 
              value={currBranch} 
              onChange={(e)=>{setCurrBranch(e.target.value)}}
              style={{ width: '200px', height: '120px', padding: '5px' }}
            >
              {githubData.branches.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>

            <button onClick={handleBranchSelect} type="submit">Get Branch</button>
            
          </div>:"" }

          {
            filesFetched ? 
            <>
             <h2>Files are: </h2>

             {fileTree && (
                <FileTree
                  node={fileTree}
                  selected={filesSelected}
                  onToggle={toggleFile}
                />
              )}

             <button onClick={handleFilesSubmit} type="submit" >Submit</button>
            </>
            :""
          }

        </>
    )
}