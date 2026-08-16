import { useState } from 'react';
import {useAuth} from '../context/AuthContext'
import Signup from './Signup';

export default function Login () {
    const {login, loginWithGoogle} = useAuth();
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
        const {data, error} = await login(formData.email, formData.password);
        if(error){
            console.log(error);

        }else{
            console.log(`Data: ${JSON.stringify(data)}`); 
        }
        
    }
    return(<>
    <h1>Login Page</h1>
        <form onSubmit={handleSubmit}>
           <label htmlFor='email'>Enter email:</label>
           <input type="email" id='email' name='email' onChange={handleChange} value={formData.email}></input>

           <label htmlFor='password'>Enter Password:</label>
           <input type="password" id='password' name='password' onChange={handleChange} value={formData.password}></input>

           <button>Sign In</button>
        </form>

        <div>
            <button onClick={()=> loginWithGoogle()}>Sign In With Google</button>
            
        </div>
    </>)
}