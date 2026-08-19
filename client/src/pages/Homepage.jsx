import { useState } from "react";
import { useAuth } from "../context/AuthContext"

export default function Homepage(){

    const {user, logout} = useAuth();
    const [formData, setFormData] = useState({
      github_url:""
    });

    const handleInputChange = (e)=>{
      const {name, value} = e.target;
      setFormData((prev)=>({
        ...prev,
        [name]:value
      }))
    }
    
    return(
        <>
          <input onChange={handleInputChange} type="url" placeholder="enter your github url..." name="github_url" value={formData.github_url}></input>
          <button onClick={()=>{logout()}}>
            Logout
          </button>
        </>
    )
}