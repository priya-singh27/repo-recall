import { useState } from "react";
import { useAuth } from "../context/AuthContext"

const API_URL = import.meta.env.VITE_API_URL;

export default function Homepage(){

    const {user, logout} = useAuth();
    const [formData, setFormData] = useState({
      github_url:""
    });
    const [githubData, setGithubData] =useState({
      repo:"",
      branches: "",
      files: ""
    });

    const handleInputChange = (e)=>{
      const {name, value} = e.target;
      setFormData((prev)=>({
        ...prev,
        [name]:value
      }))
    }
    
    const handleSubmit = async(e) => {
      e.preventDeafult();
      const response = await fetch(`${API_URL}/repo/details`,{
        method:'POST',
        headers: {
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(formData.github_url)
      });
      if(!response.ok){
        return;
      }
      const json_data = await response;
      console.log("🔥")
      console.log(json_data)
      setGithubData({
        repo: json_data.repo,
        branches: json_data.branches,
        files: json_data.files,
      })

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

          {githubData.branches!=="" && <div>
            <p>{githubData.repo}</p>
            <p>{githubData.branches}</p>
            <p>{githubData.files}</p>
          </div> }

        </>
    )
}