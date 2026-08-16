import { useAuth } from "../context/AuthContext"

export default function Homepage(){

    const {user, logout} = useAuth()
    
    return(
        <>
          <h1>Welcom,{user.email}</h1>
          <button onClick={()=>{logout()}}>
            Logout
          </button>
        </>
    )
}