import { useState } from "react";
import { useAuth } from "../context/AuthContext"

const API_URL = import.meta.env.VITE_API_URL;

export default function Homepage(){

    const {user, logout} = useAuth();
    const [formData, setFormData] = useState({
      github_url:""
    });
    const [githubData, setGithubData] =useState(null);

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
      console.log("❌");
      console.log(response)
      if(!response.ok){
        return;
      }
      const json_data = await response.json();
      console.log("🔥")
      console.log(json_data)
      setGithubData({
        repo: json_data["data"].repo,
        branches: json_data["data"].branches,
        files: json_data["data"].files,
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

          {githubData ? <div>
            <h2>Branches:</h2>
            {githubData.branches.map((item)=><p>{item.name}</p>
            )}
            

            <h2>Files: </h2>
            {githubData.files.tree.map(item=>{
              return<ol>
                <li>
                {item.path}
                </li>
              </ol>
             
            })}
            
          </div>:"" }

        </>
    )
}