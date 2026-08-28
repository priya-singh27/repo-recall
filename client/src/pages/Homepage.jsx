import { useState } from "react";
import { useAuth } from "../context/AuthContext"

const API_URL = import.meta.env.VITE_API_URL;

export default function Homepage(){

    const {user, logout} = useAuth();
    const [formData, setFormData] = useState({
      github_url:""
    });
    const [githubData, setGithubData] =useState(null);
    const [filesFetched, setFilesFetched] = useState(null);
    const [currBranch, setCurrBranch] = useState(null);
    const [filesSelected, setFilesSelected] = useState([]);

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
          'Content-Type': 'application/json' 
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
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(body)
      });

      console.log("Sent request...");
      console.log("ℹ️")

      const files = await files_response.json();

      console.log("👌🏼 Fetched file for the main branch: ")
      console.log(files);

      setFilesFetched(files.data.files.tree.filter((item) => item.type === "blob"));
    }

    const handleFileSelect = (e)=>{
      console.log(e.target.options);
      const selectedOptions = Array.from(e.target.options)
      .filter(option => option.selected)
      .map(option => option.value);
      
      console.log("Selected options: ")
      setFilesSelected(selectedOptions);
      console.log(selectedOptions);
    }

    const handleFilesSubmit= async()=>{
      const body={
        filesSelected
      }

      const embeddign_res = await fetch(`${API_URL}/repo/index`,{
        method:'POST',
        headers: {
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(body)
      });

      const embedding_json = await embeddign_res.json();//raw json string to js object

      console.log("Embeddign data...")
      console.log(embedding_json);

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

             <select multiple={true} onChange={handleFileSelect} value={filesSelected} style={{ width: '100%', height: '200px', padding: '25px', color:"blue"}}>
              
              {filesFetched.map((item,idx)=>{
                const item_obj_strign = JSON.stringify(item);
                return <option key={idx} value={item_obj_strign} >
                {item.path}
              </option>
              })}
             </select>

             <button onClick={handleFilesSubmit} type="submit" >Submit</button>
            </>
            :""
          }

        </>
    )
}