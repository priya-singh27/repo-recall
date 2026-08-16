import { useState } from 'react';
import {useAuth} from '../context/AuthContext'

export default function Signup () {
    const {signUp, loginWithGoogle } = useAuth();
    const [formData, setFormData] = useState({
        email:"",
        password:""
    });
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev)=>({
            ...prev,
            [name]: value
        }));
    }
    const handleSubmit=async (e)=> {
        e.preventDefault();
        const {data, error} = await signUp(formData.email, formData.password);
        if(error){
            console.log(error);

        }else{
            console.log(`Data: ${JSON.stringify(data)}`); 
        }
    }
    return(<>
        <h1>
            Signup Page
        </h1>
        <form onSubmit={handleSubmit}>
           <label htmlFor='email'>Enter email:</label>
           <input type="email" id='email' name='email' onChange={handleChange} value={formData.email}></input>

           <label htmlFor='password'>Enter Password:</label>
           <input type="password" id='password' name='password' onChange={handleChange} value={formData.password}></input>

           <button>Sign Up</button>
        </form>

        <div>
            <button onClick={()=> loginWithGoogle()}>Sign In With Google</button>
        </div>
    </>)
}